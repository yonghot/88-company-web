'use client';

import { useState, useEffect } from 'react';
import { LeadData } from '@/lib/types';
import * as XLSX from 'xlsx';
import { Download, RefreshCw, Search, Filter, Eye } from 'lucide-react';
import Image from 'next/image';

export default function AdminPage() {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<LeadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWelcome, setFilterWelcome] = useState('all');
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

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

  useEffect(() => {
    let filtered = [...leads];

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.education?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.region?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterWelcome !== 'all') {
      filtered = filtered.filter(lead => lead.welcome === filterWelcome);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, filterWelcome, leads]);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredLeads.map(lead => ({
      '이름': lead.name || '',
      '전화번호': lead.phone || '',
      '인증상태': lead.verified ? '인증완료' : '미인증',
      '예비창업자여부': lead.welcome || '',
      '정부지원사업경험': lead.experience || '',
      '사업아이템': lead.business_idea || '',
      '지역': lead.region || '',
      '성별': lead.gender || '',
      '나이': lead.age || '',
      '학력및전공': lead.education || '',
      '직업상태': lead.occupation || '',
      '등록일시': lead.createdAt ? new Date(lead.createdAt).toLocaleString('ko-KR') : ''
    })));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '리드목록');

    const wscols = [
      { wch: 10 },  // 이름
      { wch: 15 },  // 전화번호
      { wch: 10 },  // 인증상태
      { wch: 20 },  // 예비창업자여부
      { wch: 20 },  // 정부지원사업경험
      { wch: 30 },  // 사업아이템
      { wch: 15 },  // 지역
      { wch: 10 },  // 성별
      { wch: 10 },  // 나이
      { wch: 30 },  // 학력및전공
      { wch: 20 },  // 직업상태
      { wch: 20 }   // 등록일시
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `88_리드목록_${new Date().toISOString().split('T')[0]}.xlsx`);
  };


  const welcomeOptions = ['all', ...Array.from(new Set(leads.map(lead => lead.welcome).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0D13] to-[#141821]">
      {/* 헤더 */}
      <div className="bg-[#1A1F2E]/80 backdrop-blur-lg border-b border-[#2E3544]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/88-logo.png" alt="88" width={40} height={40} className="w-10 h-10 rounded-full border border-[#00E5DB]/30" />
              <div>
                <h1 className="text-xl font-bold text-gray-100">88 관리자</h1>
                <p className="text-sm text-gray-400">리드 관리 시스템</p>
              </div>
            </div>
            <div className="flex gap-2">
<button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#252B3B] rounded-lg hover:bg-[#00E5DB]/10 hover:text-[#00E5DB] border border-[#2E3544] hover:border-[#00E5DB]/30 transition-all"
              >
                챗봇으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                <p className="text-sm text-gray-400">인증 완료</p>
                <p className="text-2xl font-bold text-gray-100">
                  {leads.filter(lead => lead.verified).length}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Eye className="w-6 h-6 text-green-500" />
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
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <RefreshCw className="w-6 h-6 text-blue-500" />
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
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Download className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 액션 */}
        <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, 전화번호, 학력, 직업, 지역으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#252B3B] border border-[#2E3544] text-gray-200 placeholder-gray-500 rounded-lg focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30 transition-all"
                />
              </div>
            </div>

            {/* 예비창업자 필터 */}
            <select
              value={filterWelcome}
              onChange={(e) => setFilterWelcome(e.target.value)}
              className="px-4 py-2 bg-[#252B3B] border border-[#2E3544] text-gray-200 rounded-lg focus:border-[#00E5DB] focus:ring-2 focus:ring-[#00E5DB]/30"
            >
              {welcomeOptions.map(option => (
                <option key={option} value={option}>
                  {option === 'all' ? '전체 상태' : option}
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
              className="px-4 py-2 bg-gradient-to-r from-[#00E5DB] to-[#00C7BE] text-gray-900 rounded-lg hover:shadow-[0_0_20px_rgba(0,229,219,0.3)] transition-all flex items-center gap-2 font-semibold"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-[#1A1F2E] rounded-xl border border-[#2E3544] overflow-hidden">
          <div className="overflow-x-auto min-w-full">
            <table className="w-full">
              <thead className="bg-[#252B3B] border-b border-[#2E3544]">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">이름</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">전화번호</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">상태</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">학력/전공</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">직업</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">지역</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300">등록일시</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2E3544]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                      리드가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead: LeadData) => (
                    <tr key={lead.id} className="hover:bg-[#252B3B]/50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-200">{lead.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-200">{lead.phone}</div>
                        {lead.verified && (
                          <span className="text-xs text-green-500">✓ 인증완료</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-[#00E5DB]/10 text-[#00E5DB] rounded-full border border-[#00E5DB]/20">
                          {lead.welcome || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-200 max-w-[200px] truncate">
                        {lead.education || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-200">
                        {lead.occupation || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-200">
                        {lead.region || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.createdAt && new Date(lead.createdAt).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1 text-gray-400 hover:text-[#00E5DB] transition-colors"
                            title="상세 정보 보기"
                          >
                            <Eye className="w-4 h-4" />
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-100">리드 상세 정보</h2>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 hover:bg-[#252B3B] rounded-lg transition-colors text-gray-400"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">이름</label>
                      <p className="text-gray-200 mt-1">{selectedLead.name}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">전화번호</label>
                      <p className="text-gray-200 mt-1">
                        {selectedLead.phone}
                        {selectedLead.verified && (
                          <span className="ml-2 text-xs text-green-500">✓ 인증완료</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">예비창업자 여부</label>
                    <p className="text-gray-200 mt-1">{selectedLead.welcome || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">정부지원사업 경험</label>
                    <p className="text-gray-200 mt-1">{selectedLead.experience || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">사업 아이템</label>
                    <p className="text-gray-200 mt-1">{selectedLead.business_idea || '-'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-400">지역</label>
                      <p className="text-gray-200 mt-1">{selectedLead.region || '-'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-400">성별</label>
                      <p className="text-gray-200 mt-1">{selectedLead.gender || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">나이</label>
                    <p className="text-gray-200 mt-1">{selectedLead.age || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">최종 학력 및 전공</label>
                    <p className="text-gray-200 mt-1 whitespace-pre-wrap">{selectedLead.education || '-'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-400">현재 직업 상태</label>
                    <p className="text-gray-200 mt-1 whitespace-pre-wrap">{selectedLead.occupation || '-'}</p>
                  </div>

                  <div className="pt-4 border-t border-[#2E3544]">
                    <label className="text-sm font-medium text-gray-400">등록일시</label>
                    <p className="text-gray-200 mt-1">
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
