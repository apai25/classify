"use client";

import { useState } from 'react';

import {
    Card,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import dayjs from "dayjs"

export default function Home() { 

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    }

    const handleFileUpload = async () => {
        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('date', dayjs().format('MM-DD-YYYY'))
            
            setLoading(true);
            const response = await fetch('http://127.0.0.1:8080/get-vocal-expressions', {
              method: 'POST',
              body: formData,
            });
            setLoading(false);
      
            if (!response.ok) {
              throw new Error('Upload failed');
            }
      
            console.log('File uploaded successfully');
          } catch (error) {
            console.error('Error uploading file:', error);
          }
    }
    
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-12">
            <CardTitle className="mb-5">Camera Feed: Upload Camera Footage</CardTitle>
            <div className="flex items-center space-x-4">
                <Input type="file" onChange={handleFileChange}/>
                <Button disabled={file == null} onClick={handleFileUpload} >Upload</Button>
            </div>
        </main>
    );
}
