import dayjs from 'dayjs';
import { useEffect, useRef, useState, useCallback } from 'react';
import { faker } from '@faker-js/faker';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { Paper, CardContent, IconButton, InputBase } from '@mui/material';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Send } from '@mui/icons-material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Order from './order';
import socketIOClient from 'socket.io-client';


export default function AppView() {
  const [chat, setChat] = useState([]);
  const [socket, setSocket] = useState(null);
  const [chatText, setChatText] = useState(""); 
  const [lastMessage, setLastMessage] = useState("Ask me about what's happening at school.");
  const [day, setDay] = useState(dayjs());
  const [description, setDescription] = useState({});
  const scrollRef = useRef(null);

  const fakeAlertArray = [
    { id: 3, title: 'Alert 1', description: 'This is a description of the alert.', postedAt: faker.date.recent() },
    { id: faker.string.uuid(), title: 'Alert 2', description: 'This is a description of the alert.', postedAt: faker.date.recent() },
    { id: faker.string.uuid(), title: 'Alert 3', description: 'This is a description of the alert.', postedAt: faker.date.recent() },
    { id: faker.string.uuid(), title: 'Alert 4', description: 'This is a description of the alert.', postedAt: faker.date.recent() },
    { id: faker.string.uuid(), title: 'Alert 5', description: 'This is a description of the alert.', postedAt: faker.date.recent() },
  ]

  const dateChanged = (newDay) => {
    setDay(newDay);
  };

  const sendMessage = () => {
    setChat([...chat, { user: "computer", msg: lastMessage }, { user: "client", msg: chatText }]);
    setLastMessage("");
    if (socket) {
      socket.emit('chat', { input: chatText });
      setChatText("");
    }
  };

  useEffect(() => {
    const socketCurr = socketIOClient("ws://127.0.0.1:8080/");
    setSocket(socketCurr);

    socketCurr.on('chat', (data) => {
      if (data.done !== true) {
        setLastMessage(data.answer);
      }
    });

    return () => {
      socketCurr.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getDescription = useCallback(async () => {
    const formData = new FormData();
    formData.append('date', day.format("MM-DD-YYYY"));
  
    const response = await fetch('http://127.0.0.1:8080/get-summary-by-date', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setDescription(data);
  }, [day]);
  

  useEffect(() => {
    getDescription();
    
  }, [day, getDescription]);

  const [notifications, setNotifications] = useState([]);
  
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/get-notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      console.log(data);
      setNotifications(data[day.format("MM-DD-YYYY")]); // Update state with new notifications
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
    useEffect(() => {
      const intervalId = setInterval(fetchNotifications, 4000); // Fetch every 5 seconds (adjust as needed)
      
      // Cleanup function to clear interval when component unmounts
      return () => clearInterval(intervalId);
    }, []);

  const subjects = [
    { name: 'Math', icon: '/assets/icons/glass/ic_glass_users.png', description: description.Math || 'description of what happened in class today.' },
    { name: 'English', icon: '/assets/icons/glass/ic_glass_buy.png', description: description.English || 'description of what happened in class today.' },
    { name: 'History', icon: '/assets/icons/glass/ic_glass_message.png', description: description['Social Studies'] || 'description of what happened in class today.' },
    { name: 'Science', icon: '/assets/icons/glass/ic_glass_bag.png', description: description.Science || 'description of what happened in class today.' },
  ];

  return (
    <Container maxWidth="xl">
      <Order />
    </Container>
  );
}
