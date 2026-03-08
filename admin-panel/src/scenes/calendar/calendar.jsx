import { useState, useCallback, useEffect, memo } from "react";
import FullCalendar, { formatDate } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  useTheme,
  CircularProgress,
} from "@mui/material";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent } from "../../api";

const Calendar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [currentEvents, setCurrentEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from database on load
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const events = await fetchCalendarEvents();
        // Transform database events to FullCalendar format
        const formattedEvents = events.map(event => ({
          id: event.id.toString(),
          title: event.title,
          start: event.start,
          end: event.end,
          allDay: event.all_day || false,
          backgroundColor: event.color || colors.greenAccent[500],
          borderColor: event.color || colors.greenAccent[500],
        }));
        setCurrentEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [colors.greenAccent]);

  const handleDateClick = useCallback(async (selected) => {
    const title = prompt("Please enter a new title for your event");
    const calendarApi = selected.view.calendar;
    calendarApi.unselect();

    if (title) {
      try {
        // Save event to database
        const newEvent = await createCalendarEvent({
          title,
          start: selected.startStr,
          end: selected.endStr,
          all_day: selected.allDay,
        });
        
        // Add event to calendar with the database ID
        calendarApi.addEvent({
          id: newEvent.id.toString(),
          title,
          start: selected.startStr,
          end: selected.endStr,
          allDay: selected.allDay,
        });
      } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to save event: ' + (error.message || 'Please try again.'));
      }
    }
  }, []);

  const handleEventClick = useCallback(async (selected) => {
    if (
      window.confirm(
        `Are you sure you want to delete the event '${selected.event.title}'`
      )
    ) {
      try {
        // Delete event from database
        await deleteCalendarEvent(selected.event.id);
        // Remove from calendar UI
        selected.event.remove();
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  }, []);

  // Memoized event handler to prevent infinite loop
  const handleEventsSet = useCallback((events) => {
    setCurrentEvents(events);
  }, []);

  return (
    <Box m="20px">
      <Header title="Calendar" subtitle="Full Calendar Interactive Page" />

      <Box display="flex" justifyContent="space-between">
        {/* CALENDAR SIDEBAR */}
        <Box
          flex="1 1 20%"
          backgroundColor={colors.primary[400]}
          p="15px"
          borderRadius="4px"
        >
          <Typography variant="h5">Events</Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p="20px">
              <CircularProgress color="secondary" />
            </Box>
          ) : currentEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              No events. Click on a date to create one.
            </Typography>
          ) : (
            <List>
              {currentEvents.map((event) => (
                <ListItem
                  key={event.id}
                  sx={{
                    backgroundColor: colors.greenAccent[500],
                    margin: "10px 0",
                    borderRadius: "2px",
                  }}
                >
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <Typography>
                        {formatDate(event.start, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* CALENDAR */}
        <Box flex="1 1 100%" ml="15px">
          <FullCalendar
            height="75vh"
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              interactionPlugin,
              listPlugin,
            ]}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
            }}
            initialView="dayGridMonth"
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            select={handleDateClick}
            eventClick={handleEventClick}
            eventsSet={handleEventsSet}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default memo(Calendar);
