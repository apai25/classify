"use client";
import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Classes from "../components/classes";
import Notifications from "../components/notifications";
import { DatePicker } from "@/components/date";
import dayjs from 'dayjs';
import socketIOClient from "socket.io-client";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export default function Home() { 
  const [searchOpen, setSearchOpen] = useState(false)
  const [description, setDescription] = useState({});
  const [date, setDate] = useState(new Date())
  const [notifications, setNotifications] = useState([]);
  const [lastMessage, setLastMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  const getDescription = useCallback(async () => {
    const formData = new FormData();
    const formattedDate = dayjs(date).format("MM-DD-YYYY");
    formData.append('date', formattedDate);

    const response = await fetch('http://127.0.0.1:8080/get-summary-by-date', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    setDescription(data);
    console.log(data);
  }, [date]);
  

  useEffect(() => {
    getDescription();
    
  }, [date, getDescription]);

  

  
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8080/get-notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      console.log(data);
      setNotifications(data[dayjs(date).format("MM-DD-YYYY")]); // Update state with new notifications
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
    useEffect(() => {
      const intervalId = setInterval(fetchNotifications, 4000); // Fetch every 5 seconds (adjust as needed)
      
      // Cleanup function to clear interval when component unmounts
      return () => clearInterval(intervalId);
    }, []);

  useEffect(() => {
    const socketCurr = socketIOClient("ws://127.0.0.1:8080/");
    setSocket(socketCurr);

    console.log('Connected to socket');

    socketCurr.on('chat', (data) => {
      if (data.done !== true) {
        setLastMessage(data.answer);
      }
    });

    return () => {
      socketCurr.disconnect();
    };
  }, []);

  const handleSearchInputChange = (e) => { 
    const input = e.target.value;
    console.log(input)
    setSearchInput(input);
  }

  const doSearch = () => {
    if (socket) {
      socket.emit('chat', { input: searchInput });
    }
  }

  const subjects = [
    { name: 'Math', icon: '/assets/icons/glass/ic_glass_users.png', description: description.Math || 'description of what happened in class today.' },
    { name: 'English', icon: '/assets/icons/glass/ic_glass_buy.png', description: description.English || 'description of what happened in class today.' },
    { name: 'History', icon: '/assets/icons/glass/ic_glass_message.png', description: description['Social Studies'] || 'description of what happened in class today.' },
    { name: 'Science', icon: '/assets/icons/glass/ic_glass_bag.png', description: description.Science || 'description of what happened in class today.' },
  ];
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">



    {/* <Button variant="secondary" className="w-40">
      <MagnifyingGlassIcon className="mr-2 h-4 w-4" /> Search...
    </Button> */}

      <div className="grid gap-4 grid-cols-5">

      <DatePicker date={date} setDate={setDate}/>

      <div className="col-span-3 flex justify-center items-center">
        <Button variant="outline" className="w-72" onClick={() => setSearchOpen(true)}>
        <MagnifyingGlassIcon className="mr-2 h-4 w-4" /> Search...
        </Button>
      </div>


      <div className="grid gap-4 col-span-3 grid-cols-2">
      {subjects.map((subject, index) => (
        <Classes key={index} name={subject.name} description={subject.description} />
      ))}
      </div>

      {/* <div className="grid gap-4 col-span-2 grid-cols-1"> */}
      <Notifications className="col-span-2" notis={notifications}/>
      
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
      {/* {<CommandInput 
        placeholder="Type a command or search..." 
        value={searchInput} 
        onOpenChange={handleSearchInputChange}
        onKeyDown={(e) => {
          if (e.key == 'Enter') { 
            doSearch();
          }}}/> } */}
          <Input placeholder="Type a command or search..." 
            value={searchInput}
            onChange={handleSearchInputChange}
            onKeyDown={(e) => {
              if (e.key == 'Enter') { 
                doSearch();
              }}}
          />
      <CommandList>
        <CommandItem>{lastMessage}</CommandItem>
        
      </CommandList>
    </CommandDialog>
    </main>
  );
}
