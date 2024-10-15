import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchBox() {
  const [searchText, setSearchText] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const clearSearch = () => {
    setSearchText('');
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
      {searchText && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}
