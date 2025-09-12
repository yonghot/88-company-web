import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fallback to file system if Supabase is not configured
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && 
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase');
};

// File system fallback functions
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function getLeadsFromFile() {
  try {
    const data = await readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveLeadsToFile(leads: any[]) {
  await ensureDataDirectory();
  await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Normalize phone number (remove dashes) to use as ID
    const phoneId = body.phone?.replace(/-/g, '');
    
    if (!phoneId || !body.verified) {
      return NextResponse.json(
        { success: false, error: '인증된 휴대폰 번호가 필요합니다.' },
        { status: 400 }
      );
    }
    
    if (isSupabaseConfigured()) {
      // Use Supabase
      const leadData = {
        id: phoneId,
        service: body.service,
        budget: body.budget,
        timeline: body.timeline,
        message: body.message || '',
        name: body.name,
        phone: body.phone,
        verified: body.verified || false,
      };

      // Check for existing lead
      const { data: existingLeads, error: selectError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', phoneId);

      if (selectError) {
        console.error('Supabase select error:', selectError);
        throw selectError;
      }

      let result;
      if (existingLeads && existingLeads.length > 0) {
        // Update existing lead
        const { data, error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', phoneId)
          .select()
          .single();

        if (error) throw error;
        result = { lead: data, updated: true };
      } else {
        // Insert new lead
        const { data, error } = await supabase
          .from('leads')
          .insert([leadData])
          .select()
          .single();

        if (error) throw error;
        result = { lead: data, updated: false };
      }

      console.log('Lead saved to Supabase:', result.lead);
      return NextResponse.json({ success: true, ...result }, { status: result.updated ? 200 : 201 });
    } else {
      // Fallback to file system
      const leads = await getLeadsFromFile();
      
      // Check for duplicate phone number
      const existingLead = leads.find((lead: any) => lead.id === phoneId);
      if (existingLead) {
        // Update existing lead
        const updatedLead = {
          ...existingLead,
          ...body,
          id: phoneId,
          updatedAt: new Date().toISOString()
        };
        
        const updatedLeads = leads.map((lead: any) => 
          lead.id === phoneId ? updatedLead : lead
        );
        
        await saveLeadsToFile(updatedLeads);
        console.log('Lead updated (file system):', updatedLead);
        
        return NextResponse.json({ success: true, lead: updatedLead, updated: true }, { status: 200 });
      }
      
      // Create new lead
      const lead = {
        id: phoneId,
        ...body,
        createdAt: new Date().toISOString()
      };
      
      leads.push(lead);
      await saveLeadsToFile(leads);
      console.log('New lead saved (file system):', lead);
      
      return NextResponse.json({ success: true, lead }, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      // Use Supabase
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      return NextResponse.json({ success: true, leads: leads || [] });
    } else {
      // Fallback to file system
      const leads = await getLeadsFromFile();
      return NextResponse.json({ success: true, leads });
    }
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      // Use Supabase
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Lead not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({ success: true });
    } else {
      // Fallback to file system
      const leads = await getLeadsFromFile();
      const filteredLeads = leads.filter((lead: any) => lead.id !== id);
      
      if (leads.length === filteredLeads.length) {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }
      
      await saveLeadsToFile(filteredLeads);
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}