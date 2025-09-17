import * as React from 'react';
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import ArticleIcon from '@mui/icons-material/Article';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import BlockIcon from '@mui/icons-material/Block';
import Allpostprofile from '../horizontal_tabs/Allpostprofile';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// -----------------------------
// Calendar Component (Fully Functional)
// -----------------------------
const CalendarStreak = () => {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth()); // 0 = Jan
  const [streakData, setStreakData] = React.useState(null);
  const { user } = useAuth();
  
  // Get user streak data from Firestore
  React.useEffect(() => {
    if (!user) return;
    
    const userSticksRef = doc(db, 'userSticks', user.uid);
    const unsubscribe = onSnapshot(userSticksRef, (doc) => {
      if (doc.exists()) {
        setStreakData(doc.data());
      }
    });
    
    return () => unsubscribe();
  }, [user]);

  // Convert Firestore dates to day numbers for current month/year
  const streakDays = React.useMemo(() => {
    if (!streakData?.streakDays) return [];
    return streakData.streakDays
      .map(dateStr => new Date(dateStr))
      .filter(date => 
        date.getMonth() === month && 
        date.getFullYear() === year
      )
      .map(date => date.getDate());
  }, [streakData, month, year]);

  // Days in this month  
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // First weekday index (0 = Sunday, 1 = Monday ... 6 = Saturday)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Build weeks grid (full 6x7 typically)
  const weeks = [];
  let currentDay = 1;
  const totalCells = Math.ceil((daysInMonth + firstDayIndex) / 7) * 7;

  for (let cell = 0; cell < totalCells; cell++) {
    if (cell % 7 === 0) weeks.push([]);

    if (cell < firstDayIndex || currentDay > daysInMonth) {
      weeks[weeks.length - 1].push(null); // Empty cell
    } else {
      weeks[weeks.length - 1].push(currentDay);
      currentDay++;
    }
  }

  // Navigation
  const handlePrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'JAN','FEB','MAR','APR','MAY','JUN',
    'JUL','AUG','SEP','OCT','NOV','DEC'
  ];

  return (
    <Box
      sx={{
        width: '100%',
        textAlign: 'center',
        border: '1px solid #ddd',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        boxShadow: 1,
      }}
    >
      {streakData && (
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            bgcolor: '#fafafa',
          }}
        >
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold flex items-center gap-1">
              {streakData.currentStreak} <WhatshotIcon sx={{ color: 'orange' }} />
            </div>
            <div className="text-xs text-gray-600">Current Streak</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold flex items-center gap-1">
              {streakData.longestStreak} <WhatshotIcon sx={{ color: 'orange' }} />
            </div>
            <div className="text-xs text-gray-600">Longest Streak</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold">+{streakData.currentPostPoints}</div>
            <div className="text-xs text-gray-600">Points Today</div>
          </div>
        </Box>
      )}

      {/* Header with navigation */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #eee',
          bgcolor: '#fafafa',
        }}
      >
        <ChevronLeftIcon
          onClick={handlePrev}
          sx={{ cursor: 'pointer', color: 'text.secondary' }}
        />
        <span style={{ fontWeight: 'bold' }}>
          {monthNames[month]} {year}
        </span>
        <ChevronRightIcon
          onClick={handleNext}
          sx={{ cursor: 'pointer', color: 'text.secondary' }}
        />
      </Box>

      {/* Week Days */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          py: 1,
          fontSize: 12,
          fontWeight: 'bold',
          color: 'gray',
        }}
      >
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </Box>

      {/* Days Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          p: 1,
        }}
      >
        {weeks.map((week, wi) =>
          week.map((d, di) => {
            const isToday =
              d &&
              year === today.getFullYear() &&
              month === today.getMonth() &&
              d === today.getDate();

            const isStreak = d && streakDays.includes(d);

            return (
              <Box
                key={`${wi}-${di}`}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  bgcolor: isToday ? 'rgba(25,118,210,0.1)' : 'transparent',
                  border: isToday
                    ? '2px solid #1976d2'
                    : '1px solid transparent',
                  position: 'relative',
                  cursor: d ? 'pointer' : 'default'
                }}
              >
                {d && (
                  <>
                    {isStreak ? (
                      <WhatshotIcon 
                        sx={{ 
                          color: 'orange',
                          fontSize: 24,
                          animation: 'flame 0.3s ease-in-out',
                          '@keyframes flame': {
                            '0%': { transform: 'scale(0.8)', opacity: 0 },
                            '100%': { transform: 'scale(1)', opacity: 1 }
                          }
                        }} 
                      />
                    ) : streakData?.lastStickDate && new Date(streakData.lastStickDate).getDate() === d ? (
                      <BlockIcon 
                        sx={{ 
                          color: 'red',
                          fontSize: 20,
                          opacity: 0.5 
                        }} 
                      />
                    ) : (
                      <span className={`text-sm ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                        {d}
                      </span>
                    )}
                    
                    {isToday && streakData && !isStreak && (
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-bounce">
                        !
                      </div>
                    )}
                  </>
                )}
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

// -----------------------------
// Tabs Panel
// -----------------------------
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`custom-tabpanel-${index}`}
      aria-labelledby={`custom-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>{children}</Box>}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `custom-tab-${index}`,
    'aria-controls': `custom-tabpanel-${index}`,
  };
}

// -----------------------------
// HorizontalTabs (Main Component)
// -----------------------------
export default function HorizontalTabs() {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: { xs: 0, sm: 1 },
        mt: 2,
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="icon tabs"
        variant="fullWidth"
        TabIndicatorProps={{
          style: {
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
          },
        }}
        sx={{
          minHeight: 56,
          '& .MuiTab-root': {
            minHeight: 56,
            minWidth: 0,
            p: 0,
            color: 'text.secondary',
            '&:hover': {
              bgcolor: 'action.hover',
              color: 'primary.main',
            },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        <Tab
          icon={<ArticleIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />}
          aria-label="All Posts"
          {...a11yProps(0)}
        />
        <Tab
          icon={<CalendarMonthIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />}
          aria-label="Calendar"
          {...a11yProps(1)}
        />
      </Tabs>

      {/* All Posts */}
      <CustomTabPanel value={value} index={0}>
        <Box sx={{ fontSize: 18, color: 'text.primary' }}>
          <Allpostprofile />
        </Box>
      </CustomTabPanel>

      {/* Functional Calendar */}
      <CustomTabPanel value={value} index={1}>
        <CalendarStreak />
      </CustomTabPanel>
    </Box>
  );
}