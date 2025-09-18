import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { LeadData } from '@/lib/types';

const LEADS_FILE = path.join(process.cwd(), 'data', 'leads.json');

async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await mkdir(dataDir, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

async function getLeads() {
  try {
    const data = await readFile(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    // File doesn't exist yet
    return [];
  }
}

async function saveLeads(leads: LeadData[]) {
  await ensureDataDirectory();
  await writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    const leads = await getLeads();
    const filteredLeads = leads.filter((lead: LeadData) => lead.id !== id);
    
    if (leads.length === filteredLeads.length) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }
    
    await saveLeads(filteredLeads);
    
    console.log('Lead deleted:', id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}