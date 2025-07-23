'use client'

import { CountdownWidget } from '@/components/widgets/countdown-widget'
import { addDays } from 'date-fns'

export default function TestCountdownPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-white text-2xl mb-8">Countdown Widget Variations</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 30 days countdown with dots (default) */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">30 days - Dots (Medium)</h2>
          <CountdownWidget 
            title="Payday" 
            totalDays={30}
            remainingDays={28}
            variant="dots"
            size="medium"
          />
        </div>
        
        {/* 14 days countdown with dots */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">14 days - Dots (Medium)</h2>
          <CountdownWidget 
            title="Vacation" 
            totalDays={14}
            remainingDays={12}
            variant="dots"
            size="medium"
          />
        </div>
        
        {/* 7 days countdown with dots */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">7 days - Dots (Small)</h2>
          <CountdownWidget 
            title="Deadline" 
            totalDays={7}
            remainingDays={5}
            variant="dots"
            size="small"
          />
        </div>
        
        {/* 100 days countdown with dots */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">100 days - Dots (Large)</h2>
          <CountdownWidget 
            title="Holiday" 
            totalDays={100}
            remainingDays={95}
            variant="dots"
            size="large"
          />
        </div>
        
        {/* 4 days countdown with circles */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">4 days - Circles (Small)</h2>
          <CountdownWidget 
            title="Weekend" 
            totalDays={4}
            remainingDays={2}
            variant="circles"
            size="small"
          />
        </div>
        
        {/* 20 days countdown with circles */}
        <div className="h-[300px] w-[250px]">
          <h2 className="text-white mb-2">20 days - Circles (Medium)</h2>
          <CountdownWidget 
            title="Conference" 
            totalDays={20}
            remainingDays={18}
            variant="circles"
            size="medium"
          />
        </div>
      </div>
    </div>
  )
} 