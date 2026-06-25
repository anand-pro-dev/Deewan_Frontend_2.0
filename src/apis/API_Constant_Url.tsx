import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://Deewan.cloud/api/api/', 
  baseURL: 'http://localhost:3000/api', 
  headers : {
    "Content-Type": "application/json" 
  }
 
});




const apiForm = axios.create({
  // baseURL: 'https://Deewan.cloud/api/api/', 
  baseURL: 'http://localhost:3000/api', 
});

export   {api , apiForm};

