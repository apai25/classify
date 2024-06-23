import dayjs from 'dayjs';
import { useEffect, useRef, useState, useCallback } from 'react';
import { faker } from '@faker-js/faker';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { CardContent, Paper, IconButton, InputBase } from '@mui/material';
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

  const subjects = [
    { name: 'Math', icon: '/assets/icons/glass/ic_glass_users.png', description: description.Math || 'description of what happened in class today.' },
    { name: 'English', icon: '/assets/icons/glass/ic_glass_buy.png', description: description.English || 'description of what happened in class today.' },
    { name: 'History', icon: '/assets/icons/glass/ic_glass_message.png', description: description['Social Studies'] || 'description of what happened in class today.' },
    { name: 'Science', icon: '/assets/icons/glass/ic_glass_bag.png', description: description.Science || 'description of what happened in class today.' },
  ];

  return (
    <Container maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={2}>
          <Typography variant="h4" sx={{ mb: 5 }}>
            Lesson Recap for {
              day.format("MM/DD/YYYY") === dayjs().format("MM/DD/YYYY") ? "Today" :
              day.format("dddd, MM/DD")
            }
          </Typography>
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker value={day} onChange={dateChanged} />
          </LocalizationProvider>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {subjects.map((subject) => (
          <Grid key={subject.name} xs={12} sm={6} md={3}>
            <Card
              component={Stack}
              spacing={3}
              direction="row"
              sx={{ px: 3, py: 5, borderRadius: 2 }}
            >
              <Box sx={{ width: 64, height: 64 }}>
                <img alt="icon" src={subject.icon} />
              </Box>
              <Stack spacing={0.5}>
                <Typography variant="h4">{subject.name}</Typography>
                <Typography variant="subtitle2" sx={{ color: 'text.disabled' }}>
                  {subject.description}
                </Typography>
              </Stack>
            </Card>
          </Grid>
        ))}

        <Grid xs={12} sm={6} md={8} style={{ height: 772 }}>
          <Card
            spacing={3}
            direction="row"
            sx={{ px: 3, py: 5, borderRadius: 2, position: "relative", height: "100%", overflow: 'auto' }}
            ref={scrollRef}
          >
            {chat.map((chatItem, index) => {
              const align = chatItem.user === "computer" ? "flex-start" : "flex-end";
              const color = chatItem.user === "computer" ? "#fff" : "#F6E6CB";
              return (
                <Grid container justifyContent={align} spacing={2} key={index}>
                  <Grid item style={{ maxWidth: "80%" }}>
                    <Card variant="outlined" style={{ padding: 10, backgroundColor: color }}>
                      <CardContent>
                        {chatItem.msg}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              );
            })}

            {lastMessage.length > 0 && 
              <Grid container justifyContent="flex-start" spacing={2}>
                <Grid item style={{ maxWidth: "80%" }}>
                  <Card variant="outlined" style={{ padding: 10, backgroundColor: "#fff" }}>
                    <CardContent>
                      {lastMessage}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            }
          </Card>
          <Paper
            onSubmit={(e) => console.log(chatText)}
            sx={{ p: '2px 4px', marginTop: 1, display: 'flex', alignItems: 'center'}}
          >
            <InputBase
              sx={{ ml: 1, flex: 1 }}
              placeholder="Send message to chat."
              inputProps={{ 'aria-label': 'search google maps' }}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
            <IconButton type="button" sx={{ p: '10px' }} aria-label="search" onClick={sendMessage}>
              <Send />
            </IconButton>
          </Paper>
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          <Card
              component={Stack}
              spacing={3}
              direction="row"
              sx={{ px: 3, py: 5, borderRadius: 2 }}
            >
              <Stack spacing={0.5}>
                <Typography variant="h4">Alerts</Typography>
                <Typography variant="subtitle1" sx={{ color: 'text' }}>
                  <List>
                    <ListItem>test1</ListItem>
                    <ListItem>test1</ListItem>
                    <ListItem>test1</ListItem>
                  </List>
                </Typography>
              </Stack>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
