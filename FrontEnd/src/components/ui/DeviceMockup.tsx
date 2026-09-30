import React from 'react';

interface DeviceMockupProps {
  children: React.ReactNode;
}

export const DeviceMockup: React.FC<DeviceMockupProps> = ({ children }) => {
  return (
    <div className="h-screen w-full bg-white md:flex md:items-center md:justify-center md:overflow-hidden md:p-4">
      {/* Mobile view (no mockup) */}
      <div className="block md:hidden min-h-screen w-full bg-white relative">
        {children}
      </div>

      {/* Mockup view for md and up (iPhone 17 Dimensions) */}
      <div 
        className="hidden md:block relative border-gray-800 dark:border-gray-800 bg-gray-800 border-[12px] rounded-[2.5rem] shadow-2xl shrink-0" 
        style={{ 
          width: '375px',
          height: 'min(90vh, 785px)'
        }}
      >
        {/* Hardware buttons */}
        <div className="h-[4%] w-[3px] bg-gray-800 absolute -left-[15px] top-[10%] rounded-l-lg"></div>
        <div className="h-[6%] w-[3px] bg-gray-800 absolute -left-[15px] top-[17%] rounded-l-lg"></div>
        <div className="h-[6%] w-[3px] bg-gray-800 absolute -left-[15px] top-[24%] rounded-l-lg"></div>
        <div className="h-[8%] w-[3px] bg-gray-800 absolute -right-[15px] top-[19%] rounded-r-lg"></div>
        
        {/* Screen content */}
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white relative">
          <div className="h-full w-full overflow-y-auto no-scrollbar [&_*]:no-scrollbar relative z-0 flex flex-col [&>div]:!min-h-full [&>div]:!h-full">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
};
