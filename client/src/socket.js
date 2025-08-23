import { io } from "socket.io-client";

// The server URL should match the address of your running backend
const URL = "http://localhost:3001";

export const socket = io(URL);
