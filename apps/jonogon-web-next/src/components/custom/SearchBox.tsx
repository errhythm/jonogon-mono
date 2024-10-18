import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { trpc } from '@/trpc/client';
import debounce from 'lodash/debounce';
import { removeStopwords, eng, ben } from 'stopword';

export default function SearchBox({ setSearchResults }: { setSearchResults: (results: any[]) => void }) {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { refetch } = trpc.petitions.search.useQuery(
    { query: searchText },
    { enabled: false }
  );

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      const words = query.split(' ').filter(word => word.trim() !== '');
      const cleanedWords = removeStopwords(words, [...eng, ...ben]);
      const cleanedQuery = cleanedWords.join(' ').trim();

      if (cleanedWords.length >= 2 && cleanedQuery.length >= 5) {
        setIsSearching(true);
        const results = await refetch();
        if (results.data) {
          setSearchResults(results.data.data);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300),
    [refetch, setSearchResults]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchText = e.target.value;
    setSearchText(newSearchText);
    debouncedSearch(newSearchText);
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
  };

  return (
    <div className="relative w-full mx-auto mb-4">
      <Input
        type="text"
        placeholder="Search for a দাবি"
        className="pl-10 pr-10 py-2 w-full rounded-lg border-2 border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        value={searchText}
        onChange={handleInputChange}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      {searchText && !isSearching && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      )}
      {isSearching && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
        </div>
      )}
    </div>
  );
}
