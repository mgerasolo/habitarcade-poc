import * as MuiIcons from '@mui/icons-material';

interface TodayHeaderProps {
  date: string;
}

/**
 * Header for the Today page showing current date and greeting
 */
export function TodayHeader({ date }: TodayHeaderProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="px-6 py-8 border-b border-slate-700/50 bg-slate-800/30">
      <div className="flex items-center gap-4">
        {/* Today Icon */}
        <div className="
          w-14 h-14 rounded-2xl
          bg-gradient-to-br from-teal-500 to-teal-600
          flex items-center justify-center
          shadow-lg shadow-teal-500/30
        ">
          <MuiIcons.Today style={{ fontSize: 28, color: 'white' }} />
        </div>

        {/* Title and Date */}
        <div>
          <h1 className="text-2xl font-bold text-white font-condensed">
            {getGreeting()}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {formatDate(date)}
          </p>
        </div>
      </div>
    </header>
  );
}

export default TodayHeader;
