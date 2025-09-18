import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import Stripe from 'stripe';

// Utility function to upload image to Cloudinary
async function uploadToCloudinary(imageUrl: string, folder: string = 'visualizer/projects'): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const formData = new FormData();
    formData.append('file', new File([blob], 'image.png', { type: blob.type || 'image/png' }));
    formData.append('folder', folder);
    
    const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cloudinary-upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to Cloudinary');
    }
    
    const data = await uploadResponse.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        try {
          // Save order to database
          await saveOrderToDatabase(session as Stripe.Checkout.Session);
        } catch (dbError) {
          // Don't return error here as payment is already processed
        }
        
        break;

      case 'payment_intent.succeeded':
        // Payment succeeded
        break;

      case 'payment_intent.payment_failed':
        // Payment failed
        break;

      default:
        // Unhandled event type
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Function to save order to database
async function saveOrderToDatabase(session: Stripe.Checkout.Session) {
  const db = getDb();
  
  // Parse items from metadata
  let items = [];
  try {
    items = JSON.parse(session.metadata?.items || '[]');
  } catch (error) {
    items = [];
  }

  // Create order document
  const orderData = {
    id: session.id,
    customerEmail: session.customer_email,
    customerName: session.customer_details?.name || '',
    amountTotal: session.amount_total,
    amountSubtotal: session.amount_subtotal,
    currency: session.currency,
    paymentStatus: session.payment_status,
    status: 'completed',
    items: items,
    shippingAddress: (session as Stripe.Checkout.Session & { shipping_details?: { address?: Stripe.Address } }).shipping_details?.address || null,
    billingAddress: session.customer_details?.address || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeSessionId: session.id,
    paymentIntentId: session.payment_intent,
  };

  // Save order to orders collection
  const orderRef = doc(db, 'orders', session.id);
  await setDoc(orderRef, orderData);

  // Upsert client record based on order customer
  let clientId: string | null = null;
  try {
    const clientEmail = session.customer_email || '';
    if (clientEmail) {
      clientId = clientEmail; // use email as client doc id for simplicity
      const clientDocRef = doc(db, 'clients', clientId);
      await setDoc(clientDocRef, {
        id: clientId,
        name: session.customer_details?.name || clientEmail.split('@')[0] || 'Customer',
        email: clientEmail,
        phone: session.customer_details?.phone || '',
        address: (session.customer_details?.address && JSON.stringify(session.customer_details.address)) || '',
        createdAt: new Date(),
        lastContact: new Date(),
        updatedAt: new Date(),
      }, { merge: true });
    }
  } catch (_clientErr) {
    // do not fail webhook on client upsert
  }

  // Create a corresponding project from this order with detailed information
  try {
    const primaryItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
    const isVisualizer = (session.metadata?.type || '') === 'visualizer';
    const primaryTitle = isVisualizer ? (primaryItem?.name || 'Visualizer Project') : (primaryItem?.name || 'New Project');
    const clientName = session.customer_details?.name || session.customer_email || 'Customer';
    const budget = typeof session.amount_total === 'number' ? Math.round(session.amount_total / 100) : 0; // dollars
    const projectId = isVisualizer ? `viz-${session.id}` : `proj-${session.id}`;

    // Build comprehensive project description from order details
    let projectDescription = isVisualizer
      ? `Project created from Visualizer order ${session.id}.\n\n`
      : `Project created from order ${session.id}.\n\n`;
    
    if (primaryItem) {
      projectDescription += `Primary Service: ${primaryItem.name}\n`;
      if (primaryItem.description) {
        projectDescription += `Description: ${primaryItem.description}\n`;
      }
      if (primaryItem.category) {
        projectDescription += `Category: ${primaryItem.category}\n`;
      }
      if (primaryItem.estimatedTimeline) {
        projectDescription += `Estimated Timeline: ${primaryItem.estimatedTimeline}\n`;
      }
      if (primaryItem.complexity) {
        projectDescription += `Complexity: ${primaryItem.complexity}\n`;
      }
      if (primaryItem.includedServices && Array.isArray(primaryItem.includedServices)) {
        projectDescription += `\nIncluded Services:\n`;
        primaryItem.includedServices.forEach((service: { title: string; estimatedPrice?: number }, index: number) => {
          projectDescription += `${index + 1}. ${service.title}`;
          if (service.estimatedPrice) {
            projectDescription += ` ($${service.estimatedPrice})`;
          }
          projectDescription += `\n`;
        });
      }
    }

    // Note: Order summary and customer details are stored separately in the project document
    // and are only visible to project owners and admins for privacy protection

    // Calculate estimated end date based on timeline if available
    let estimatedEndDate = null;
    if (primaryItem?.estimatedTimeline) {
      const timeline = primaryItem.estimatedTimeline.toLowerCase();
      const now = new Date();
      
      if (timeline.includes('week')) {
        const weeks = parseInt(timeline.match(/\d+/)?.[0] || '1');
        estimatedEndDate = new Date(now.getTime() + (weeks * 7 * 24 * 60 * 60 * 1000));
      } else if (timeline.includes('month')) {
        const months = parseInt(timeline.match(/\d+/)?.[0] || '1');
        estimatedEndDate = new Date(now.getTime() + (months * 30 * 24 * 60 * 60 * 1000));
      } else if (timeline.includes('day')) {
        const days = parseInt(timeline.match(/\d+/)?.[0] || '1');
        estimatedEndDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
      }
    }

    const projectDoc = doc(db, 'projects', projectId);
    const baseProject: Record<string, unknown> = {
      title: primaryTitle,
      description: projectDescription,
      clientId: clientId || session.customer_email || '',
      clientName,
      clientEmail: session.customer_email || '',
      customerEmail: session.customer_email || '',
      status: 'planning',
      startDate: new Date(),
      endDate: estimatedEndDate,
      budget,
      progress: 0,
      createdFromOrderId: session.id,
      orderItems: items, // Store full order items for reference
      orderTotal: budget,
      paymentStatus: session.payment_status,
      // Order summary fields (only visible to project owners and admins)
      orderSummary: {
        totalItems: items.length,
        orderTotal: budget,
        paymentStatus: session.payment_status,
        orderDate: new Date().toLocaleDateString(),
        customerPhone: session.customer_details?.phone || null,
        customerAddress: session.customer_details?.address || null
      },
      // Store additional metadata
      projectType: primaryItem?.category || 'general',
      complexity: primaryItem?.complexity || 'medium',
      estimatedTimeline: primaryItem?.estimatedTimeline || 'TBD',
      includedServices: primaryItem?.includedServices || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // For visualizer, attach before/after images from metadata
    if (isVisualizer) {
      const beforeUrl = session.metadata?.beforeImageUrl || '';
      const resultImageUrl = session.metadata?.resultImageUrl || '';
      
      // Upload images to Cloudinary for permanent storage
      let uploadedBeforeImageUrl = null;
      let uploadedResultImageUrl = null;

      try {
        // Upload result image (required)
        if (resultImageUrl) {
          uploadedResultImageUrl = await uploadToCloudinary(resultImageUrl, 'visualizer/projects');
        }
        
        // Upload before image if provided
        if (beforeUrl) {
          uploadedBeforeImageUrl = await uploadToCloudinary(beforeUrl, 'visualizer/projects');
        }
      } catch (uploadError) {
        console.error('Failed to upload visualizer images to Cloudinary:', uploadError);
        // Continue with original URLs as fallback, but log the error
      }

      baseProject['projectType'] = 'visualizer';
      baseProject['beforeImages'] = uploadedBeforeImageUrl ? [uploadedBeforeImageUrl] : (beforeUrl ? [beforeUrl] : []);
      baseProject['afterImages'] = uploadedResultImageUrl ? [uploadedResultImageUrl] : (resultImageUrl ? [resultImageUrl] : []);
      baseProject['spaceType'] = session.metadata?.spaceType || 'unknown';
      if (session.metadata?.spaceLabel) {
        baseProject['title'] = `Visualizer ${session.metadata.spaceLabel} - ${primaryTitle}`;
      }
    }

    await setDoc(projectDoc, baseProject, { merge: true });
  } catch (_err) {
    // swallow project creation errors to not block webhook
  }

  // If we have customer email, also save to user's orders
  if (session.customer_email) {
    try {
      // Find user by email
      const usersRef = doc(db, 'users', session.customer_email);
      const userDoc = await getDoc(usersRef);
      
      if (userDoc.exists()) {
        // Add order to user's orders array
        await updateDoc(usersRef, {
          orders: arrayUnion(session.id),
          updatedAt: new Date()
        });
      } else {
        // Create user document if it doesn't exist
        await setDoc(usersRef, {
          email: session.customer_email,
          orders: [session.id],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (userError) {
      // Don't throw error as order is already saved
    }
  }

  // Clear user's cart after successful order
  if (session.customer_email) {
    try {
      const cartRef = doc(db, 'carts', session.customer_email);
      await setDoc(cartRef, {
        items: [],
        updatedAt: new Date(),
        userId: session.customer_email
      });
    } catch (cartError) {
      // Don't throw error as order is already saved
    }
  }

}
