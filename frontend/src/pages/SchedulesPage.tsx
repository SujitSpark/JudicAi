import { useState, useMemo, useEffect } from 'react';
import { useCasesStore } from '../store/casesStore';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Trophy
} from 'lucide-react';
import { clsx } from 'clsx';
import JudicialLoader from '../components/JudicialLoader';

export default function SchedulesPage() {
  const { cases, schedules, fetchCases, fetchSchedules, isLoading } = useCasesStore();
  const [viewDate, setViewDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
    fetchSchedules();
  }, [fetchCases, fetchSchedules]);

  // Open the calendar on the month of the first scheduled hearing, so a snapshot
  // viewed later doesn't land on an empty month.
  useEffect(() => {
    if (schedules.length === 0) return;
    const first = schedules.map(s => s.hearing_date).sort()[0];
    const d = new Date(first);
    setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [schedules]);

  // Dynamic Date Calculations
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const monthName = viewDate.toLocaleDateString('en-GB', { month: 'long' });

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Get start offset (Mon=0, ..., Sun=6)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Derive which dates have hearings
  const hearingDates = useMemo(() => {
    const dates = new Set<string>();
    schedules.forEach(s => {
      const d = s.hearing_date.split('T')[0];
      dates.add(d);
    });
    return dates;
  }, [schedules]);

  // Get cases for the selected date
  const selectedDateHearings = useMemo(() => {
    if (!selectedDate) return [];
    return schedules.filter(s => s.hearing_date.split('T')[0] === selectedDate);
  }, [selectedDate, schedules]);

  // Real "Today" for highlighting
  const realToday = new Date();
  const realTodayString = realToday.toISOString().split('T')[0];

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(realTodayString);
  };

  if (isLoading && schedules.length === 0) {
    return <JudicialLoader />;
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center justify-between border-b border-outline-variant/10 pb-8">
        <div className="space-y-1">
          <h1 className="text-5xl font-serif font-bold tracking-tight text-primary">Schedules</h1>
          <p className="text-on-surface/40 font-sans font-medium uppercase tracking-[0.2em] text-[10px] font-black">
            {schedules.length} hearings placed by the Scheduler agent (genetic algorithm)
          </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Top Section: Monthly Calendar View */}
        <div className="judicial-card border-none bg-surface-container-lowest/50 backdrop-blur-sm overflow-hidden ring-1 ring-outline-variant/10">
          <div className="flex items-center justify-between px-8 py-6 bg-surface-container-low/30 border-b border-outline-variant/5">
            <h3 className="font-serif text-2xl font-bold text-primary">{monthName} {currentYear}</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-surface-container-high rounded-sm transition-colors text-on-surface/40 hover:text-primary"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={handleToday}
                className="px-3 py-1.5 hover:bg-surface-container-high rounded-sm transition-colors text-[10px] font-black uppercase tracking-widest text-primary font-bold"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-surface-container-high rounded-sm transition-colors text-on-surface/40 hover:text-primary"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7">
            {DAYS.map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-[#00003c]/30 border-r border-b border-outline-variant/10 last:border-r-0">
                {day}
              </div>
            ))}
            {Array.from({ length: 42 }, (_, i) => {
              const day = i - startOffset + 1;
              const dateObj = new Date(currentYear, currentMonth, day);
              const localYear = dateObj.getFullYear();
              const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
              const localDay = String(dateObj.getDate()).padStart(2, '0');
              const dateString = `${localYear}-${localMonth}-${localDay}`;
              const hasHearings = hearingDates.has(dateString);
              const isToday = dateString === realTodayString;
              const isSelected = dateString === selectedDate;
              const isInMonth = day > 0 && day <= daysInMonth;

              return (
                <div 
                  key={i} 
                  onClick={() => isInMonth && setSelectedDate(dateString)}
                  className={clsx(
                    "h-24 p-4 border-r border-b border-outline-variant/5 transition-all duration-300 relative group",
                    !isInMonth && "bg-surface-container-low/10 opacity-20 cursor-default",
                    isInMonth && "bg-transparent hover:bg-surface-container-low/40 cursor-pointer",
                    isSelected && "bg-surface-container-low/60 ring-2 ring-inset ring-primary/10 shadow-inner",
                    i % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx(
                      "text-sm font-mono font-bold transition-all",
                      isSelected ? "text-primary scale-110" : "text-on-surface/40",
                      isToday && "w-7 h-7 rounded-full ring-2 ring-primary bg-primary/5 flex items-center justify-center -m-1 font-black text-primary"
                    )}>
                      {isInMonth ? day : ''}
                    </span>
                    {isInMonth && hasHearings && (
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-sm ring-1 ring-white/50" />
                    )}
                  </div>
                  {isInMonth && hasHearings && (
                    <div className="mt-1">
                      <div className="text-[9px] font-black text-primary/40 uppercase tracking-tighter">
                        {schedules.filter(s => s.hearing_date.split('T')[0] === dateString).length} Hearings
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Detail List */}
        <div className="animate-slide-up min-h-[400px]">
          {!selectedDate ? (
            <div className="judicial-card p-20 flex flex-col items-center justify-center text-center space-y-4 bg-surface-container-low/10 border border-dashed border-outline-variant/20 italic">
              <CalendarIcon className="w-12 h-12 text-on-surface/10 mb-2" />
              <p className="text-[11px] font-sans font-black uppercase tracking-[0.3em] text-on-surface/30">Click on a date to view scheduled hearings</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface/40 font-bold">Docket for</span>
                  <h3 className="font-serif text-3xl font-bold text-primary">
                    {(() => {
                      const [y, m, d] = selectedDate.split('-');
                      return new Date(parseInt(y), parseInt(m)-1, parseInt(d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                    })()}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                   <Trophy className="w-5 h-5 text-secondary animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-[#00003c]/40 font-bold">AI Consistency: 98%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedDateHearings.length === 0 ? (
                   <div className="col-span-full p-12 text-center text-on-surface/20 text-sm italic font-serif bg-surface-container-low/5 rounded-sm border border-dashed border-outline-variant/10">
                     No official hearings scheduled for this session.
                   </div>
                ) : (
                  selectedDateHearings.map((h) => {
                    const caseData = cases.find(c => c.case_internal_id === h.case_internal_id);
                    return (
                      <div key={h.hearing_id} className="judicial-card p-8 flex flex-col gap-6 group hover:translate-y-[-4px] transition-all duration-500 hover:shadow-2xl hover:bg-surface-container-low ring-1 ring-outline-variant/10">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <span className="font-mono text-[10px] font-bold text-on-surface/40 uppercase tracking-widest bg-surface-container-low px-2 py-1 rounded-sm">#{caseData?.case_id || '???'}</span>
                            <h4 className="font-serif text-xl font-bold text-primary leading-tight group-hover:text-secondary transition-colors line-clamp-1">{caseData?.case_number || 'Historical Record'}</h4>
                          </div>
                          <div className="px-3 py-1 rounded-sm text-[10px] font-black uppercase tracking-widest shadow-sm bg-primary text-secondary-fixed">
                            {h.status}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-outline-variant/10">
                          <div className="space-y-1">
                            <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30 font-bold">Type</span>
                            <p className="text-[11px] font-sans font-bold text-on-surface/70 uppercase">{caseData?.case_type || 'Civil'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30 font-bold">Priority</span>
                            <p className="text-[11px] font-mono font-black text-primary">{caseData?.priority_score.toFixed(0) || '0'}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] font-sans font-black uppercase tracking-widest text-[#00003c]/30 font-bold">Time Slot</span>
                            <div className="flex items-center gap-1.5 text-secondary">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-sans font-bold uppercase tracking-tight">{h.slot_time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-on-surface/30" />
                            <span className="text-[11px] font-sans font-bold text-on-surface/40">Court Room No. 4, North Wing</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-100">
                            Live Listing
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
