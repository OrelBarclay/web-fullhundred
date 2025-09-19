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
  { id: 'pricing-labor', text: 'We provide labor-only pricing with materials quoted separately. This allows you to choose materials that match your budget and style preferences. All estimates include detailed breakdowns of labor and material costs.', tags: ['pricing', 'labor', 'materials', 'budget', 'customization', 'estimates', 'breakdown'] },
  { id: 'pricing-bathroom', text: 'Bathroom remodel labor costs typically range from $4,000-$15,000 depending on scope. Materials (tile, fixtures, vanity) are quoted separately. Luxury bathrooms can range from $15,000-$30,000.', tags: ['pricing', 'bathroom', 'labor', 'cost', 'fixtures', 'luxury', 'tile', 'vanity'] },
  { id: 'pricing-kitchen', text: 'Kitchen remodel labor costs range from $8,000-$25,000. This includes demo, plumbing, electrical, and installation. Appliances and materials are separate. High-end kitchens can range from $25,000-$50,000.', tags: ['pricing', 'kitchen', 'labor', 'cost', 'appliances', 'high-end', 'demo', 'electrical'] },
  { id: 'pricing-addition', text: 'Home addition labor costs typically range from $15,000-$40,000 depending on size and complexity. Foundation work and permits are additional considerations. Second-story additions typically cost $25,000-$60,000.', tags: ['pricing', 'addition', 'labor', 'cost', 'foundation', 'second-story', 'permits', 'complexity'] },
  { id: 'pricing-plumbing', text: 'Plumbing service labor costs range from $75-$150 per hour. Emergency repairs may have higher rates. Fixture installations and replacements are quoted separately. Water heater replacement typically costs $800-$2,500 including labor.', tags: ['pricing', 'plumbing', 'labor', 'cost', 'hourly', 'emergency', 'fixtures', 'water-heater', 'replacement'] },
  { id: 'pricing-painting', text: 'Painting labor costs typically range from $2-$6 per square foot for interior work and $3-$8 per square foot for exterior work. Surface preparation and materials are additional. Cabinet refinishing costs $1,500-$4,000 per kitchen.', tags: ['pricing', 'painting', 'labor', 'cost', 'square-foot', 'interior', 'exterior', 'preparation', 'cabinet', 'refinishing'] },
  { id: 'pricing-tiling', text: 'Tile installation labor costs range from $4-$12 per square foot depending on tile type and complexity. Grout, adhesive, and tile materials are quoted separately. Backsplash installation typically costs $500-$2,000.', tags: ['pricing', 'tiling', 'labor', 'cost', 'square-foot', 'tile', 'grout', 'materials', 'backsplash', 'complexity'] },
  { id: 'pricing-deck', text: 'Deck construction labor costs range from $15-$35 per square foot for basic decks and $25-$50 per square foot for complex designs with railings and features. Composite decking adds $5-$10 per square foot to material costs.', tags: ['pricing', 'deck', 'labor', 'cost', 'square-foot', 'construction', 'railings', 'complex', 'composite', 'materials'] },
  { id: 'pricing-carpentry', text: 'Custom carpentry labor costs range from $50-$100 per hour depending on complexity. Built-in furniture typically costs $1,000-$5,000 per piece. Crown molding installation costs $8-$15 per linear foot.', tags: ['pricing', 'carpentry', 'labor', 'cost', 'hourly', 'built-ins', 'furniture', 'crown-molding', 'linear-foot'] },

  // Services and Capabilities
  { id: 'services-main', text: 'Full Hundred Services is a comprehensive home renovation company specializing in: kitchen remodeling, bathroom renovation, home additions, custom carpentry, plumbing services, painting services, tiling services, deck construction, and complete project management. We handle everything from small repairs to major renovations.', tags: ['services', 'kitchen', 'bathroom', 'addition', 'carpentry', 'plumbing', 'painting', 'tiling', 'deck', 'outdoor', 'renovation', 'repair'] },
  { id: 'services-specialty', text: 'Our core specialties include custom built-ins, crown molding, wainscoting, tile work, hardwood flooring, outdoor structures like decks and pergolas, interior/exterior painting, comprehensive plumbing solutions, and complete home transformations. We combine traditional craftsmanship with modern techniques.', tags: ['services', 'custom', 'built-ins', 'molding', 'tile', 'flooring', 'painting', 'plumbing', 'deck', 'craftsmanship', 'modern'] },
  { id: 'services-management', text: 'We provide full project management including permits, inspections, material ordering, subcontractor coordination, quality control, timeline management, and regular client communication throughout every project phase.', tags: ['services', 'management', 'permits', 'inspections', 'coordination', 'timeline', 'communication', 'quality'] },
  { id: 'services-plumbing', text: 'Professional plumbing services include pipe repair and replacement, fixture installation and upgrades, water heater services, drain cleaning and repair, emergency plumbing repairs, bathroom and kitchen plumbing, and water line installations. We handle both residential and commercial plumbing needs.', tags: ['services', 'plumbing', 'pipes', 'fixtures', 'water-heater', 'drain', 'emergency', 'repair', 'bathroom', 'kitchen', 'residential', 'commercial'] },
  { id: 'services-painting', text: 'Our painting services cover interior and exterior painting, color consultation and design, surface preparation and priming, cabinet and furniture refinishing, decorative painting techniques, pressure washing, and protective coatings. We use high-quality paints and materials for lasting results.', tags: ['services', 'painting', 'interior', 'exterior', 'color', 'consultation', 'refinishing', 'decorative', 'pressure-washing', 'coatings', 'quality'] },
  { id: 'services-tiling', text: 'Expert tiling services include floor and wall tile installation, bathroom and kitchen tiling, backsplash installation, tile repair and replacement, grout cleaning and sealing, mosaic work, and specialty tile patterns. We work with ceramic, porcelain, natural stone, and glass tiles.', tags: ['services', 'tiling', 'tile', 'floor', 'wall', 'bathroom', 'kitchen', 'backsplash', 'grout', 'mosaic', 'ceramic', 'porcelain', 'stone', 'glass'] },
  { id: 'services-deck', text: 'Deck construction services include custom deck design and construction, composite and wood decking options, railings and safety features, deck repair and maintenance, outdoor lighting integration, pergolas, and outdoor living spaces. We build decks that enhance your home and outdoor lifestyle.', tags: ['services', 'deck', 'construction', 'custom', 'composite', 'wood', 'railings', 'maintenance', 'lighting', 'pergolas', 'outdoor-living'] },
  { id: 'services-kitchen', text: 'Kitchen remodeling services include custom cabinetry and storage solutions, countertop installation and replacement, appliance integration and upgrades, lighting design and installation, flooring and backsplash options, and complete kitchen transformations.', tags: ['services', 'kitchen', 'cabinetry', 'countertops', 'appliances', 'lighting', 'flooring', 'backsplash', 'remodeling'] },
  { id: 'services-bathroom', text: 'Bathroom renovation services include full bathroom remodeling and design, shower and tub installation, vanity and fixture upgrades, tile work and flooring, plumbing and electrical updates, and luxury bathroom features.', tags: ['services', 'bathroom', 'remodeling', 'shower', 'tub', 'vanity', 'fixtures', 'tile', 'plumbing', 'electrical', 'luxury'] },
  { id: 'services-addition', text: 'Home addition services include room additions and extensions, second story additions, sunroom and porch construction, garage conversions, basement finishing, and seamless integration with existing home design.', tags: ['services', 'addition', 'room', 'extension', 'second-story', 'sunroom', 'porch', 'garage', 'basement', 'integration'] },
  { id: 'services-carpentry', text: 'Custom carpentry services include custom built-in furniture, crown molding and trim work, wainscoting and paneling, custom doors and windows, decorative woodwork, and precision craftsmanship for unique home features.', tags: ['services', 'carpentry', 'custom', 'built-ins', 'molding', 'trim', 'wainscoting', 'paneling', 'doors', 'windows', 'woodwork', 'craftsmanship'] },

  // Process and Consultation
  { id: 'consultation-process', text: 'Free consultations are available Sunday through Friday. We discuss your vision, assess the space, provide timeline estimates, and create a detailed project plan.', tags: ['consultation', 'process', 'free', 'vision', 'assessment', 'planning'] },
  { id: 'consultation-schedule', text: 'Schedule consultations by calling (555) 123-4567 or through our website. We offer flexible times including evenings and weekends for busy homeowners.', tags: ['consultation', 'schedule', 'contact', 'phone', 'website', 'flexible'] },
  { id: 'consultation-followup', text: 'After consultation, we provide detailed written estimates within 48 hours, including material recommendations and timeline breakdown.', tags: ['consultation', 'followup', 'estimate', 'materials', 'timeline', 'written'] },

  // Permits and Legal
  { id: 'permits-general', text: 'We handle all necessary permits for your project. Most remodels require permits, and we ensure full compliance with local building codes.', tags: ['permits', 'legal', 'compliance', 'building', 'codes', 'handling'] },
  { id: 'permits-common', text: 'Common projects requiring permits: structural changes, electrical work, plumbing modifications, additions, and major renovations. We handle the paperwork.', tags: ['permits', 'structural', 'electrical', 'plumbing', 'additions', 'paperwork'] },

  // Materials and Quality
  { id: 'materials-quality', text: 'We work with trusted suppliers and offer material recommendations based on your budget and style. We can source everything from budget-friendly to premium options including high-end fixtures, luxury tiles, and designer materials.', tags: ['materials', 'quality', 'suppliers', 'budget', 'premium', 'sourcing', 'fixtures', 'tiles', 'designer'] },
  { id: 'materials-sustainability', text: 'We offer eco-friendly material options including sustainable flooring, low-VOC paints, energy-efficient fixtures, recycled decking materials, and water-saving plumbing fixtures for environmentally conscious homeowners.', tags: ['materials', 'eco-friendly', 'sustainable', 'low-voc', 'energy-efficient', 'green', 'recycled', 'water-saving', 'plumbing'] },
  { id: 'materials-plumbing', text: 'We use high-quality plumbing materials including PEX and copper piping, premium fixtures from trusted brands, energy-efficient water heaters, and durable faucets and showerheads that provide lasting performance.', tags: ['materials', 'plumbing', 'pex', 'copper', 'fixtures', 'water-heater', 'faucets', 'showerheads', 'durable'] },
  { id: 'materials-painting', text: 'We use premium paint brands and high-quality primers, sealers, and protective coatings. Our materials include low-VOC options, specialty finishes, and exterior paints with weather-resistant properties.', tags: ['materials', 'painting', 'premium', 'primers', 'sealers', 'coatings', 'low-voc', 'finishes', 'weather-resistant'] },
  { id: 'materials-tiling', text: 'We work with ceramic, porcelain, natural stone, glass, and specialty tiles from leading manufacturers. Our materials include premium grouts, adhesives, and sealers for professional, long-lasting installations.', tags: ['materials', 'tiling', 'ceramic', 'porcelain', 'stone', 'glass', 'grouts', 'adhesives', 'sealers', 'professional'] },
  { id: 'materials-deck', text: 'We offer pressure-treated lumber, cedar, composite decking, and exotic hardwoods. Our deck materials include premium fasteners, weather-resistant stains, and durable railings for long-lasting outdoor structures.', tags: ['materials', 'deck', 'lumber', 'cedar', 'composite', 'hardwoods', 'fasteners', 'stains', 'railings', 'outdoor'] },

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

  // Service-Specific Information
  { id: 'plumbing-emergency', text: 'We offer 24/7 emergency plumbing services for urgent issues like burst pipes, major leaks, sewer backups, and water heater failures. Emergency calls are prioritized and typically responded to within 2-4 hours.', tags: ['plumbing', 'emergency', '24-7', 'burst-pipes', 'leaks', 'sewer', 'water-heater', 'urgent'] },
  { id: 'painting-techniques', text: 'Our painting services include advanced techniques like faux finishing, color washing, stenciling, and specialty effects. We also offer pressure washing, surface repair, and protective coating applications.', tags: ['painting', 'techniques', 'faux-finishing', 'color-washing', 'stenciling', 'effects', 'pressure-washing', 'coating'] },
  { id: 'tiling-patterns', text: 'We specialize in complex tile patterns including herringbone, chevron, basketweave, and custom mosaic designs. Our tile work includes precision cutting, intricate layouts, and professional grout application.', tags: ['tiling', 'patterns', 'herringbone', 'chevron', 'basketweave', 'mosaic', 'precision', 'grout'] },
  { id: 'deck-design', text: 'Our deck designs include multi-level decks, built-in seating, outdoor kitchens, pergolas, and integrated lighting. We work with both traditional wood and modern composite materials for lasting beauty.', tags: ['deck', 'design', 'multi-level', 'seating', 'outdoor-kitchen', 'pergolas', 'lighting', 'composite'] },
  { id: 'service-combinations', text: 'We often combine services for complete transformations: kitchen remodels with plumbing and tiling, bathroom renovations with painting and fixtures, or outdoor projects with deck construction and landscaping integration.', tags: ['services', 'combinations', 'kitchen', 'bathroom', 'outdoor', 'transformations', 'integration', 'complete'] },

  // Local Expertise
  { id: 'local-experience', text: 'We have 15+ years of experience serving the local area and understand local building codes, climate considerations, and architectural styles. Our team knows the best suppliers, permit processes, and seasonal considerations for our region.', tags: ['local', 'experience', 'years', 'building-codes', 'climate', 'architecture', 'suppliers', 'permits', 'seasonal'] },
  { id: 'local-references', text: 'We have numerous satisfied customers in the area and can provide references from recent projects similar to what you\'re planning. Our portfolio includes examples of all our service types in local homes.', tags: ['local', 'references', 'customers', 'satisfied', 'recent', 'projects', 'portfolio', 'examples'] }
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
      'cost': ['price', 'pricing', 'budget', 'expensive', 'cheap', 'affordable'],
      'time': ['timeline', 'duration', 'how long', 'schedule', 'when', 'quick'],
      'kitchen': ['cook', 'cooking', 'cabinets', 'countertop', 'appliances'],
      'bathroom': ['bath', 'toilet', 'shower', 'vanity', 'tub', 'sink'],
      'deck': ['patio', 'outdoor', 'outside', 'porch', 'balcony', 'terrace'],
      'addition': ['add', 'extension', 'room', 'space', 'expansion'],
      'plumbing': ['pipes', 'fixtures', 'water', 'drain', 'toilet', 'sink', 'faucet'],
      'painting': ['paint', 'color', 'brush', 'roller', 'interior', 'exterior'],
      'tiling': ['tile', 'tiles', 'grout', 'backsplash', 'flooring', 'mosaic'],
      'carpentry': ['wood', 'woodwork', 'built-ins', 'molding', 'trim', 'custom'],
      'warranty': ['guarantee', 'guaranteed', 'support', 'coverage'],
      'permit': ['permits', 'permission', 'approval', 'legal', 'license'],
      'emergency': ['urgent', 'immediate', 'asap', 'rush', 'critical'],
      'repair': ['fix', 'broken', 'damage', 'restore', 'maintenance']
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


