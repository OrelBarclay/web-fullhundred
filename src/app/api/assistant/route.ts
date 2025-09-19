import { NextRequest, NextResponse } from 'next/server';

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

// Comprehensive knowledge base for Full Hundred Services
const KNOWLEDGE_SNIPPETS: Array<{ id: string; text: string; tags: string[] }> = [
  // Timeline Information
  { id: 'timeline-bathroom', text: 'Bathroom remodels typically take 2-6 weeks: small updates (2-3 weeks), full remodels (4-6 weeks). Factors include scope, material availability, and permit requirements.', tags: ['timeline', 'bathroom', 'remodel', 'duration', 'planning'] },
  { id: 'timeline-kitchen', text: 'Kitchen remodels range from 4-12 weeks: minor updates (4-6 weeks), major renovations (8-12 weeks). Custom cabinets and countertops may extend timelines.', tags: ['timeline', 'kitchen', 'remodel', 'duration', 'cabinets'] },
  { id: 'timeline-addition', text: 'Home additions typically take 8-16 weeks depending on size and complexity. Permits and inspections can add 2-4 weeks to the process.', tags: ['timeline', 'addition', 'home', 'permit', 'inspection'] },
  { id: 'timeline-deck', text: 'Deck construction usually takes 1-3 weeks: simple decks (1 week), complex designs with railings and stairs (2-3 weeks). Weather can affect outdoor projects.', tags: ['timeline', 'deck', 'outdoor', 'construction', 'weather'] },
  { id: 'timeline-plumbing', text: 'Plumbing projects vary by scope: simple repairs (1-2 days), fixture installations (1-3 days), bathroom plumbing (3-7 days), whole-house repiping (1-2 weeks).', tags: ['timeline', 'plumbing', 'repair', 'fixtures', 'bathroom', 'repiping', 'duration'] },
  { id: 'timeline-painting', text: 'Painting timelines depend on area size: single room (2-4 days), whole house interior (1-2 weeks), exterior painting (3-7 days). Weather affects exterior work.', tags: ['timeline', 'painting', 'interior', 'exterior', 'room', 'house', 'weather', 'duration'] },
  { id: 'timeline-tiling', text: 'Tile installation varies by complexity: simple floor tiling (1-3 days), bathroom tiling (3-5 days), complex patterns or large areas (1-2 weeks).', tags: ['timeline', 'tiling', 'floor', 'bathroom', 'patterns', 'complex', 'duration'] },

  // Pricing Information
  { id: 'pricing-labor', text: 'We provide labor-only pricing with materials quoted separately. This allows you to choose materials that match your budget and style preferences.', tags: ['pricing', 'labor', 'materials', 'budget', 'customization'] },
  { id: 'pricing-bathroom', text: 'Bathroom remodel labor costs typically range from $4,000-$15,000 depending on scope. Materials (tile, fixtures, vanity) are quoted separately.', tags: ['pricing', 'bathroom', 'labor', 'cost', 'fixtures'] },
  { id: 'pricing-kitchen', text: 'Kitchen remodel labor costs range from $8,000-$25,000. This includes demo, plumbing, electrical, and installation. Appliances and materials are separate.', tags: ['pricing', 'kitchen', 'labor', 'cost', 'appliances'] },
  { id: 'pricing-addition', text: 'Home addition labor costs typically range from $15,000-$40,000 depending on size and complexity. Foundation work and permits are additional considerations.', tags: ['pricing', 'addition', 'labor', 'cost', 'foundation'] },
  { id: 'pricing-plumbing', text: 'Plumbing service labor costs range from $75-$150 per hour. Emergency repairs may have higher rates. Fixture installations and replacements are quoted separately.', tags: ['pricing', 'plumbing', 'labor', 'cost', 'hourly', 'emergency', 'fixtures'] },
  { id: 'pricing-painting', text: 'Painting labor costs typically range from $2-$6 per square foot for interior work and $3-$8 per square foot for exterior work. Surface preparation and materials are additional.', tags: ['pricing', 'painting', 'labor', 'cost', 'square-foot', 'interior', 'exterior', 'preparation'] },
  { id: 'pricing-tiling', text: 'Tile installation labor costs range from $4-$12 per square foot depending on tile type and complexity. Grout, adhesive, and tile materials are quoted separately.', tags: ['pricing', 'tiling', 'labor', 'cost', 'square-foot', 'tile', 'grout', 'materials'] },
  { id: 'pricing-deck', text: 'Deck construction labor costs range from $15-$35 per square foot for basic decks and $25-$50 per square foot for complex designs with railings and features.', tags: ['pricing', 'deck', 'labor', 'cost', 'square-foot', 'construction', 'railings', 'complex'] },

  // Services and Capabilities
  { id: 'services-main', text: 'Full Hundred Services specializes in: kitchen remodeling, bathroom renovation, home additions, custom carpentry, plumbing services, painting services, tiling services, deck construction, and complete project management.', tags: ['services', 'kitchen', 'bathroom', 'addition', 'carpentry', 'plumbing', 'painting', 'tiling', 'deck', 'outdoor'] },
  { id: 'services-specialty', text: 'Our specialties include custom built-ins, crown molding, wainscoting, tile work, hardwood flooring, outdoor structures like decks and pergolas, interior/exterior painting, and comprehensive plumbing solutions.', tags: ['services', 'custom', 'built-ins', 'molding', 'tile', 'flooring', 'painting', 'plumbing', 'deck'] },
  { id: 'services-management', text: 'We provide full project management including permits, inspections, material ordering, subcontractor coordination, and quality control throughout the project.', tags: ['services', 'management', 'permits', 'inspections', 'coordination'] },
  { id: 'services-plumbing', text: 'Professional plumbing services include pipe repair and replacement, fixture installation and upgrades, water heater services, drain cleaning and repair, and emergency plumbing repairs.', tags: ['services', 'plumbing', 'pipes', 'fixtures', 'water-heater', 'drain', 'emergency', 'repair'] },
  { id: 'services-painting', text: 'Our painting services cover interior and exterior painting, color consultation and design, surface preparation and priming, cabinet and furniture refinishing, and decorative painting techniques.', tags: ['services', 'painting', 'interior', 'exterior', 'color', 'consultation', 'refinishing', 'decorative'] },
  { id: 'services-tiling', text: 'Expert tiling services include floor and wall tile installation, bathroom and kitchen tiling, backsplash installation, tile repair and replacement, and grout cleaning and sealing.', tags: ['services', 'tiling', 'tile', 'floor', 'wall', 'bathroom', 'kitchen', 'backsplash', 'grout'] },
  { id: 'services-deck', text: 'Deck construction services include custom deck design and construction, composite and wood decking options, railings and safety features, deck repair and maintenance, and outdoor lighting integration.', tags: ['services', 'deck', 'construction', 'custom', 'composite', 'wood', 'railings', 'maintenance', 'lighting'] },

  // Process and Consultation
  { id: 'consultation-process', text: 'Free consultations are available Sunday through Friday. We discuss your vision, assess the space, provide timeline estimates, and create a detailed project plan.', tags: ['consultation', 'process', 'free', 'vision', 'assessment', 'planning'] },
  { id: 'consultation-schedule', text: 'Schedule consultations by calling (555) 123-4567 or through our website. We offer flexible times including evenings and weekends for busy homeowners.', tags: ['consultation', 'schedule', 'contact', 'phone', 'website', 'flexible'] },
  { id: 'consultation-followup', text: 'After consultation, we provide detailed written estimates within 48 hours, including material recommendations and timeline breakdown.', tags: ['consultation', 'followup', 'estimate', 'materials', 'timeline', 'written'] },

  // Permits and Legal
  { id: 'permits-general', text: 'We handle all necessary permits for your project. Most remodels require permits, and we ensure full compliance with local building codes.', tags: ['permits', 'legal', 'compliance', 'building', 'codes', 'handling'] },
  { id: 'permits-common', text: 'Common projects requiring permits: structural changes, electrical work, plumbing modifications, additions, and major renovations. We handle the paperwork.', tags: ['permits', 'structural', 'electrical', 'plumbing', 'additions', 'paperwork'] },

  // Materials and Quality
  { id: 'materials-quality', text: 'We work with trusted suppliers and offer material recommendations based on your budget and style. We can source everything from budget-friendly to premium options.', tags: ['materials', 'quality', 'suppliers', 'budget', 'premium', 'sourcing'] },
  { id: 'materials-sustainability', text: 'We offer eco-friendly material options including sustainable flooring, low-VOC paints, and energy-efficient fixtures for environmentally conscious homeowners.', tags: ['materials', 'eco-friendly', 'sustainable', 'low-voc', 'energy-efficient', 'green'] },

  // Warranty and Support
  { id: 'warranty-coverage', text: 'All our work comes with a 2-year warranty on labor and craftsmanship. We stand behind our work and provide ongoing support for your project.', tags: ['warranty', 'coverage', 'labor', 'craftsmanship', 'support', 'guarantee'] },
  { id: 'warranty-materials', text: 'Material warranties vary by manufacturer. We provide warranty information for all materials used and help coordinate any warranty claims.', tags: ['warranty', 'materials', 'manufacturer', 'claims', 'coordination', 'information'] },

  // Payment and Financing
  { id: 'payment-terms', text: 'We offer flexible payment terms: 50% deposit to start, 40% at project midpoint, and 10% upon completion. We accept cash, check, and major credit cards.', tags: ['payment', 'terms', 'deposit', 'midpoint', 'completion', 'flexible'] },
  { id: 'financing-options', text: 'We can provide referrals to trusted financing partners for larger projects. Many homeowners use home equity loans or personal loans for renovations.', tags: ['financing', 'options', 'referrals', 'home-equity', 'personal-loans', 'partners'] },

  // Emergency and Maintenance
  { id: 'emergency-services', text: 'We offer emergency repair services for urgent issues like water damage, structural problems, or safety concerns. Call our emergency line for immediate assistance.', tags: ['emergency', 'repair', 'urgent', 'water-damage', 'structural', 'safety'] },
  { id: 'maintenance-tips', text: 'We provide maintenance guides for your new installations and offer annual check-ups to ensure everything continues working properly.', tags: ['maintenance', 'tips', 'guides', 'check-ups', 'preventive', 'care'] },

  // Technology and Innovation
  { id: 'technology-tools', text: 'We use modern tools and technology including 3D design software, laser levels, and precision measuring equipment for accurate, professional results.', tags: ['technology', 'tools', '3d-design', 'laser', 'precision', 'professional'] },
  { id: 'innovation-smart', text: 'We can integrate smart home features like automated lighting, smart thermostats, and home security systems into your renovation project.', tags: ['innovation', 'smart-home', 'automation', 'lighting', 'thermostat', 'security'] },

  // Local Expertise
  { id: 'local-experience', text: 'We have 15+ years of experience serving the local area and understand local building codes, climate considerations, and architectural styles.', tags: ['local', 'experience', 'years', 'building-codes', 'climate', 'architecture'] },
  { id: 'local-references', text: 'We have numerous satisfied customers in the area and can provide references from recent projects similar to what you\'re planning.', tags: ['local', 'references', 'customers', 'satisfied', 'recent', 'projects'] }
];

function simpleRetrieve(query: string, k: number = 4): string[] {
  const q = query.toLowerCase();
  
  // Enhanced scoring with better keyword matching
  const scored = KNOWLEDGE_SNIPPETS.map((s) => {
    const text = s.text.toLowerCase();
    
    // Direct text matches get highest score
    const directMatches = text.split(' ').filter(word => q.includes(word)).length;
    
    // Tag matches get high score
    const tagHits = s.tags.reduce((acc, t) => {
      if (q.includes(t)) return acc + 2;
      // Partial tag matches
      if (t.includes(q) || q.includes(t)) return acc + 1;
      return acc;
    }, 0);
    
    // Phrase matches get medium score
    const phraseMatches = q.split(' ').filter(word => word.length > 2 && text.includes(word)).length;
    
    // Synonym matching for common terms
    const synonyms: Record<string, string[]> = {
      'cost': ['price', 'pricing', 'budget', 'expensive', 'cheap'],
      'time': ['timeline', 'duration', 'how long', 'schedule'],
      'kitchen': ['cook', 'cooking', 'cabinets', 'countertop'],
      'bathroom': ['bath', 'toilet', 'shower', 'vanity'],
      'deck': ['patio', 'outdoor', 'outside', 'porch'],
      'addition': ['add', 'extension', 'room', 'space'],
      'warranty': ['guarantee', 'guaranteed', 'support'],
      'permit': ['permits', 'permission', 'approval', 'legal']
    };
    
    let synonymScore = 0;
    for (const [key, values] of Object.entries(synonyms)) {
      if (q.includes(key)) {
        synonymScore += values.filter(syn => text.includes(syn)).length;
      }
    }
    
    const totalScore = directMatches * 3 + tagHits * 2 + phraseMatches + synonymScore;
    
    return { id: s.id, score: totalScore, text: s.text };
  }).sort((a, b) => b.score - a.score);
  
  // Return top results, but ensure we have at least some results
  const results = scored.slice(0, k).map((s) => s.text);
  
  // If no good matches, return some general information
  if (results.length === 0 || scored[0]?.score === 0) {
    return [
      'We offer comprehensive home renovation services including kitchen and bathroom remodels, home additions, and custom carpentry.',
      'Free consultations are available to discuss your project vision and provide detailed estimates.',
      'All our work comes with a 2-year warranty on labor and craftsmanship.'
    ];
  }
  
  return results;
}

async function callOpenAI(messages: ChatMessage[], context: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback: rule-based response
    return `Here is what I can tell you right now: ${context}`;
  }
  const sys: ChatMessage = {
    role: 'system',
    content:
      'You are Full Hundred Services\' AI project assistant. You help homeowners with renovation and construction questions. Be friendly, professional, and informative. Use the provided context to give accurate, helpful answers. When appropriate, ask 2-3 qualifying questions about their project (type, budget, timeline, location). Always offer to schedule a free consultation. Keep responses conversational but informative. If you don\'t know something specific, say so and offer to connect them with our team for detailed answers.',
  };
  const ctx: ChatMessage = { role: 'system', content: `Context:\n${context}` };

  const payload = {
    model: 'gpt-4o-mini',
    messages: [sys, ctx, ...messages],
    temperature: 0.4,
  };

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  return content;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, scheduleRequest } = (await request.json()) as {
      messages: ChatMessage[];
      scheduleRequest?: { name?: string; email?: string; phone?: string; preferredTime?: string };
    };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUser?.content || '';
    const retrieved = simpleRetrieve(query, 3).join('\n');

    // Optionally handle scheduling intents (MVP: echo back instructions)
    if (scheduleRequest) {
      const { name, email, phone, preferredTime } = scheduleRequest;
      const ack = `Thanks${name ? `, ${name}` : ''}! I\'ve noted your consultation request${preferredTime ? ` for ${preferredTime}` : ''}. We\'ll confirm by email${email ? ` (${email})` : ''}${phone ? ` or phone (${phone})` : ''}.`;
      return NextResponse.json({ reply: ack, scheduled: true });
    }

    const reply = await callOpenAI(messages, retrieved);
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


