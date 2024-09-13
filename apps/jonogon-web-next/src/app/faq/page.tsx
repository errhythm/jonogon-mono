'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/app/components/ui/collapsible';
import ReactMarkdown from 'react-markdown';
import { faqItems, FAQItem } from './faqData';

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const [openItems, setOpenItems] = useState<Record<number, boolean>>({});
  const toggleItem = (index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
    setOpenItems(prev => 
      prev.includes(index) ? prev.filter((i: number) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="max-w-screen-sm mx-auto mt-28 px-4 flex flex-col justify-center mb-20">
      <h1 className="text-4xl font-bold mb-8 text-red-500 font-serif">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <Collapsible
            key={index}
            open={openItems[index] || false}
            onOpenChange={() => toggleItem(index)}
          >
            <CollapsibleTrigger className="flex justify-between items-center w-full py-4 px-6 bg-[#F7F2EE] bg-opacity-10 text-black hover:text-red-500 font-medium rounded-md border-2 border-black border-opacity-10 transition-colors duration-200">
              <span className="font-sans text-left">{item.question}</span>
              {openItems[index] ?
                <ChevronUp className="w-5 h-5 flex-shrink-0 ml-2" />
              ) : (
                <ChevronDown className="w-5 h-5 flex-shrink-0 ml-2" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 mb-4 px-6 py-4 bg-white rounded-md shadow-sm">
                <ReactMarkdown 
                  className="font-sans text-gray-700 faq-content"
                  components={{
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
                    li: ({node, ...props}) => <li className="my-1" {...props} />
                  }}
                >
                  {item.answer}
                </ReactMarkdown>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}