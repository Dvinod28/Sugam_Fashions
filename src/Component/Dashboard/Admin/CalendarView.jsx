import React, { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useSelector } from 'react-redux';

// Custom CSS for pink theme
const calendarStyles = `
  .react-calendar {
    background-color: white;
    border: 1px solid #fce7f3;
    border-radius: 0.5rem;
    font-family: inherit;
  }
  
  .react-calendar__navigation button {
    color: #be185d;
    min-width: 44px;
    background: none;
    font-size: 16px;
    margin-top: 8px;
    font-weight: 600;
  }
  
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: #fce7f3;
    border-radius: 0.375rem;
  }
  
  .react-calendar__tile {
    padding: 10px 6.6667px;
    background: none;
    text-align: center;
    line-height: 16px;
    border-radius: 0.375rem;
  }
  
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: #fce7f3;
  }
  
  .react-calendar__tile--now {
    background: #fdf2f8;
    border: 1px solid #f9a8d4;
  }
  
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: #fce7f3;
  }
  
  .react-calendar__tile--active {
    background: #ec4899;
    color: white;
  }
  
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: #db2777;
  }
  
  .react-calendar__month-view__weekdays__weekday {
    color: #be185d;
    font-weight: 600;
  }
`

const CalendarView = () => {
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const orders = useSelector((s) => s.order?.data || []);

  const ordersByDate = useMemo(() => {
    const grouped = {};
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt).toDateString();
      if (!grouped[orderDate]) {
        grouped[orderDate] = [];
      }
      grouped[orderDate].push(order);
    });
    return grouped;
  }, [orders]);

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateString = date.toDateString();
      const dayOrders = ordersByDate[dateString];
      if (dayOrders && dayOrders.length > 0) {
        const onlineCount = dayOrders.filter(order => !order.isOffline).length;
        const offlineCount = dayOrders.filter(order => order.isOffline).length;
        return (
          <div className="text-xs text-center mt-1">
            {onlineCount > 0 && <div className="bg-pink-100 text-pink-700 rounded px-1 py-0.5 mb-1">Online: {onlineCount}</div>}
            {offlineCount > 0 && <div className="bg-pink-50 text-pink-600 rounded px-1 py-0.5">Offline: {offlineCount}</div>}
          </div>
        );
      }
    }
    return null;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const selectedDateOrders = selectedDate ? ordersByDate[selectedDate.toDateString()] || [] : [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="p-6 bg-white rounded-lg shadow-lg border border-pink-100">
        <h2 className="text-2xl font-bold mb-6 text-pink-700">Order Calendar</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
            <Calendar
              onChange={handleDateClick}
              value={date}
              tileContent={tileContent}
              className="w-full border-0 shadow-sm rounded-lg"
              tileClassName="p-2 hover:bg-pink-100 transition-colors duration-200"
              navigationLabel={({ label }) => (
                <span className="text-lg font-semibold text-pink-700">{label}</span>
              )}
            />
          </div>
        </div>

        <div className="lg:col-span-1">
          {selectedDate ? (
            <div className="bg-pink-50 p-4 rounded-lg h-full border border-pink-100">
              <h3 className="text-lg font-semibold mb-4 text-pink-700">
                Orders for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              
              {selectedDateOrders.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedDateOrders.map((order) => (
                    <div key={order.id} className="bg-white p-3 rounded-lg shadow-sm border border-pink-100 hover:shadow-md transition-shadow duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          order.isOffline 
                            ? 'bg-pink-50 text-pink-600' 
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {order.isOffline ? 'Offline' : 'Online'}
                        </span>
                        <span className="text-sm font-semibold text-pink-600">
                          ₹{order.subtotal?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-pink-800 mb-1">
                        <strong>Customer:</strong> {order.customer?.name || 'N/A'}
                      </div>
                      
                      <div className="text-sm text-pink-800 mb-1">
                        <strong>Phone:</strong> {order.customer?.phone || 'N/A'}
                      </div>
                      
                      <div className="text-sm text-pink-800 mb-2">
                        <strong>Time:</strong> {formatDate(order.createdAt)}
                      </div>
                      
                      <div className="text-sm text-pink-800">
                        <strong>Items:</strong>
                        <ul className="mt-1 space-y-1">
                          {order.items?.slice(0, 2).map((item, index) => (
                            <li key={index} className="text-xs text-pink-700">
                              • {item.name} x {item.quantity}
                            </li>
                          ))}
                          {order.items?.length > 2 && (
                            <li className="text-xs text-pink-600">+ {order.items.length - 2} more items...</li>
                          )}
                        </ul>
                      </div>
                      
                      <div className="mt-2 text-xs text-pink-600">
                        <strong>Status:</strong> {order.status || 'pending'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-pink-600">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-pink-700">No orders for this date</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-pink-50 p-4 rounded-lg h-full flex items-center justify-center border border-pink-100">
              <div className="text-center text-pink-600">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-pink-700">Click on a date</p>
                <p className="text-sm mt-1 text-pink-600">to view orders for that day</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default CalendarView;