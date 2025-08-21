import React, { useState } from 'react';
import { Search, User, AlertTriangle } from 'lucide-react';
import { Result } from '../types';
import { supabase } from '../utils/supabase';

interface SearchSectionProps {
  onSearch: (result: Result | null) => void;
  isDarkMode?: boolean;
}

export default function SearchSection({ onSearch, isDarkMode = false }: SearchSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearch = async () => {
    // التحقق من أن الاسم يحتوي على 3 أحرف على الأقل
    if (searchTerm.trim().length < 3) {
      setSearchError('يجب أن يحتوي الاسم على 3 أحرف على الأقل');
      onSearch(null);
      return;
    }

    if (!searchTerm.trim()) {
      onSearch(null);
      setSearchError('');
      return;
    }

    setSearchError('');
    setIsLoading(true);
    
    try {
      console.log('Searching for term:', searchTerm.trim());
      
      // البحث في جدول results في Supabase
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .ilike('name', `%${searchTerm.trim()}%`)
        .order('grade', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Search error:', error);
        setSearchError('حدث خطأ أثناء البحث');
        onSearch(null);
        return;
      }
      
      console.log('Search completed, results:', data);
      
      if (data && data.length > 0) {
        // حساب الترتيب للطالب
        const { data: allResults, error: rankError } = await supabase
          .from('results')
          .select('no, grade')
          .order('grade', { ascending: false });

        let rank = 1;
        if (!rankError && allResults) {
          const studentResult = allResults.find(r => r.no === data[0].no);
          if (studentResult) {
            rank = allResults.findIndex(r => r.no === data[0].no) + 1;
          }
        }

        // تحويل بيانات Supabase إلى Result
        const result: Result = {
          id: data[0].no,
          name: data[0].name,
          category: data[0].category?.toString() || 'غير محدد',
          grade: data[0].grade || 0,
          rank: rank,
          no: data[0].no
        };
        onSearch(result);
      } else {
        console.log('No results found');
        onSearch(null);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSearchError(error.message || 'حدث خطأ أثناء البحث');
      onSearch(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className={`py-16 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-700' 
        : 'bg-gradient-to-br from-blue-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-slideInDown">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Search className="w-12 h-12 text-blue-600 animate-bounce-slow" />
              <h2 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-gray-100' : 'gradient-text-animated'}`}>
                البحث عن النتائج
              </h2>
              <Search className="w-12 h-12 text-purple-600 animate-pulse" />
            </div>
            <p className={`text-xl mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              ابحث عن اسمك لمعرفة نتيجتك في المسابقة
            </p>
          </div>

          {/* Search Section */}
          <div className={`p-8 rounded-3xl shadow-2xl mb-8 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-gray-700 to-gray-600 border-2 border-gray-600/50' 
              : 'bg-gradient-to-r from-white to-blue-50 border-2 border-blue-200'
          }`}>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className={`flex rounded-2xl overflow-hidden border-2 focus-within:border-blue-500 transition-all duration-300 shadow-lg ${
                  isDarkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                }`}>
                  <div className={`px-6 py-4 flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <User className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="ادخل اسم الطالب للبحث عن النتيجة..."
                    className={`flex-1 px-6 py-4 text-right focus:outline-none text-lg transition-colors duration-300 ${
                      isDarkMode 
                        ? 'bg-gray-800 text-gray-100 placeholder-gray-400' 
                        : 'bg-white text-gray-900 placeholder-gray-500'
                    }`}
                    dir="rtl"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`px-8 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-bold text-lg transform hover:scale-105 shadow-xl ${
                  isLoading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:shadow-2xl hover:shadow-blue-500/25'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-6 h-6" />
                    بحث
                  </>
                )}
              </button>
            </div>

            {/* Search Error */}
            {searchError && (
              <div className={`p-4 rounded-xl border-2 text-center animate-fadeIn ${
                isDarkMode 
                  ? 'bg-red-900/30 border-red-600/50 text-red-300' 
                  : 'bg-red-100 border-red-300 text-red-700'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">{searchError}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}