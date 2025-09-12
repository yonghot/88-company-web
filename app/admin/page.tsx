'use client';

import { useState, useEffect } from 'react';
import { LeadData } from '@/lib/types';
import * as XLSX from 'xlsx';
import { Download, RefreshCw, Search, Filter, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

  // 리드 데이터 불러오기
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads');
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
        setFilteredLeads(data.leads);
      }
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...leads];

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.service?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 서비스 필터링
    if (filterService !== 'all') {
      filtered = filtered.filter(lead => lead.service === filterService);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, filterService, leads]);

  // 엑셀 다운로드
  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredLeads.map(lead => ({
      '이름': lead.name,
      '전화번호': lead.phone,
      '서비스': lead.service,
      '예산': lead.budget,
      '시작시기': lead.timeline,
      '상세내용': lead.message,
      '등록일시': lead.createdAt ? new Date(lead.createdAt).toLocaleString('ko-KR') : ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '리드목록');

    // 컬럼 너비 설정
    const maxWidth = 50;
    const wscols = [
      { wch: 10 }, // 이름
      { wch: 15 }, // 전화번호
      { wch: 20 }, // 서비스
      { wch: 20 }, // 예산
      { wch: 15 }, // 시작시기
      { wch: maxWidth }, // 상세내용
      { wch: 20 }  // 등록일시
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `88_리드목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // 리드 삭제
  const deleteLead = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Failed to delete lead:', error);
    }
  };

  // 서비스 목록 추출
  const services = ['all', ...Array.from(new Set(leads.map(lead => lead.service).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0D13] to-[#141821]">
      {/* 헤더 */}
      <div className="bg-[#1A1F2E]/80 backdrop-blur-lg border-b border-[#2E3544]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/88-logo.png" alt="88" className="w-10 h-10 rounded-full border border-[#00E5DB]/30" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">88 관리자</h1>
                <p className="text-sm text-gray-400">리드 관리 시스템</p>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#252B3B] rounded-lg hover:bg-[#00E5DB]/10 hover:text-[#00E5DB] border border-[#2E3544] hover:border-[#00E5DB]/30 transition-all"
            >
              챗봇으로 돌아가기
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-6 hover:border-[#00E5DB]/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">전체 리드</p>
                <p className="text-2xl font-bold text-gray-100">{leads.length}</p>
              </div>
              <div className="p-3 bg-[#00C7BE]/10 rounded-lg">
                <Filter className="w-6 h-6 text-[#00C7BE]" />
              </div>
            </div>
          </div>
          
          <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-6 hover:border-[#00E5DB]/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">오늘 등록</p>
                <p className="text-2xl font-bold text-gray-100">
                  {leads.filter(lead => {
                    if (!lead.createdAt) return false;
                    const today = new Date().toDateString();
                    const leadDate = new Date(lead.createdAt).toDateString();
                    return today === leadDate;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-6 hover:border-[#00E5DB]/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">이번 주</p>
                <p className="text-2xl font-bold text-gray-100">
                  {leads.filter(lead => {
                    if (!lead.createdAt) return false;
                    const now = new Date();
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return new Date(lead.createdAt) > weekAgo;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-6 hover:border-[#00E5DB]/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">이번 달</p>
                <p className="text-2xl font-bold text-gray-100">
                  {leads.filter(lead => {
                    if (!lead.createdAt) return false;
                    const now = new Date();
                    const leadDate = new Date(lead.createdAt);
                    return leadDate.getMonth() === now.getMonth() && 
                           leadDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Download className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 액션 */}
        <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 전화번호, 서비스로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#252B3B] border border-[#2E3544] text-gray-200 placeholder-gray-500 rounded-lg focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30 transition-all"
                />
              </div>
            </div>

            {/* 서비스 필터 */}
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-4 py-2 bg-[#252B3B] border border-[#2E3544] text-gray-200 rounded-lg focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30"
            >
              {services.map(service => (
                <option key={service} value={service}>
                  {service === 'all' ? '모든 서비스' : service}
                </option>
              ))}
            </select>

            {/* 액션 버튼들 */}
            <button
              onClick={fetchLeads}
              className="px-4 py-2 bg-[#252B3B] text-gray-300 rounded-lg hover:bg-[#00E5DB]/10 hover:text-[#00E5DB] border border-[#2E3544] hover:border-[#00E5DB]/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              새로고침
            </button>

            <button
              onClick={downloadExcel}
              className="px-4 py-2 bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900 rounded-lg hover:shadow-[0_0_20px_rgba(0,229,219,0.3)] transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#252B3B] border-b border-[#2E3544]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    전화번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    서비스
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    예산
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    시작시기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    등록일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3544]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      리드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-[#252B3B]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-200">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-[#00E5DB]/10 text-[#00E5DB] rounded-full border border-[#00E5DB]/20">
                          {lead.service}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {lead.budget}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                        {lead.timeline}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.createdAt && new Date(lead.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1 text-gray-400 hover:text-[#00E5DB] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 보기 모달 */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-100">리드 상세 정보</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-[#252B3B] rounded-lg transition-colors text-gray-400"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">이름</label>
                    <p className="text-gray-200">{selectedLead.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">전화번호</label>
                    <p className="text-gray-200">{selectedLead.phone}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">서비스</label>
                    <p className="text-gray-200">{selectedLead.service}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">예산</label>
                    <p className="text-gray-200">{selectedLead.budget}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">시작 시기</label>
                    <p className="text-gray-200">{selectedLead.timeline}</p>
                  </div>
                  
                  {selectedLead.message && (
                    <div>
                      <label className="text-sm font-medium text-gray-400">상세 내용</label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedLead.message}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-gray-400">등록일시</label>
                    <p className="text-gray-200">
                      {selectedLead.createdAt && new Date(selectedLead.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}