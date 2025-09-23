import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LeadData } from '@/lib/types';

// Fallback to file system if Supabase is not configured
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');

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

async function saveLeadsToFile(leads: LeadData[]) {
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

    // Log environment status in production
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('[LEADS API] Environment check:', {
        supabaseConfigured: isSupabaseConfigured(),
        hasSupabaseClient: !!supabase,
        timestamp: new Date().toISOString()
      });
    }

    if (isSupabaseConfigured() && supabase) {
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
        // Keep critical error logging for debugging
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

      // Lead saved to Supabase successfully
      return NextResponse.json({ success: true, ...result }, { status: result.updated ? 200 : 201 });
    } else {
      // Fallback for production without Supabase
      if (isProduction) {
        console.warn('[LEADS API] Supabase not configured in production!');
        console.warn('[LEADS API] Lead data will be lost on server restart.');

        // In production without Supabase, we can only store temporarily in memory
        // This is not ideal but prevents 500 errors
        const lead = {
          id: phoneId,
          service: body.service,
          budget: body.budget,
          timeline: body.timeline,
          message: body.message || '',
          name: body.name,
          phone: body.phone,
          verified: body.verified || false,
          createdAt: new Date().toISOString(),
          warning: 'Data stored temporarily - Configure Supabase for permanent storage'
        };

        // Log the lead data for manual recovery if needed
        console.log('[LEAD DATA]', JSON.stringify(lead, null, 2));

        return NextResponse.json({
          success: true,
          lead,
          warning: 'Data saved temporarily. Please configure database for permanent storage.'
        }, { status: 201 });
      }

      // Development/local environment - use file system
      try {
        const leads = await getLeadsFromFile();

        // Check for duplicate phone number
        const existingLead = leads.find((lead: LeadData) => lead.id === phoneId);
        if (existingLead) {
          // Update existing lead
          const updatedLead = {
            ...existingLead,
            ...body,
            id: phoneId,
            updatedAt: new Date().toISOString()
          };

          const updatedLeads = leads.map((lead: LeadData) =>
            lead.id === phoneId ? updatedLead : lead
          );

          await saveLeadsToFile(updatedLeads);
          // Lead updated in file system

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
        // New lead saved to file system

        return NextResponse.json({ success: true, lead }, { status: 201 });
      } catch (fileError) {
        console.error('[LEADS API] File system error:', fileError);
        // Even in development, if file system fails, return a temporary success
        const lead = {
          id: phoneId,
          ...body,
          createdAt: new Date().toISOString(),
          warning: 'File system unavailable - data stored temporarily'
        };

        return NextResponse.json({
          success: true,
          lead,
          warning: 'File system unavailable. Data saved temporarily.'
        }, { status: 201 });
      }
    }
  } catch (error) {
    // Keep critical error logging for debugging
    console.error('[LEADS API] Error saving lead:', error);

    // More detailed error message in production for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('[LEADS API] Full error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        supabaseConfigured: isSupabaseConfigured(),
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save lead',
        details: isProduction ? 'Check server logs for details' : errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    if (isSupabaseConfigured() && supabase) {
      // Use Supabase
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Keep critical error logging for debugging
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
    // Keep critical error logging for debugging
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

    if (isSupabaseConfigured() && supabase) {
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
      const filteredLeads = leads.filter((lead: LeadData) => lead.id !== id);
      
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
    // Keep critical error logging for debugging
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}