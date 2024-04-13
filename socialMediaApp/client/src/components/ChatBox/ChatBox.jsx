import React, { useEffect, useState, useRef } from "react";
import { addMessage, getMessages } from "../../api/MessageRequests";
import { getUser } from "../../api/UserRequests";
import "./ChatBox.css";
import { format } from "timeago.js";
import InputEmoji from 'react-input-emoji';

const ChatBox = ({ chat, currentUser, setSendMessage, receivedMessage }) => {
  const [userData, setUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const handleChange = (newMessage) => {
    setNewMessage(newMessage);
  };

  // Fetching data for header
  useEffect(() => {
    let isMounted = true;

    const userId = chat?.members?.find((id) => id !== currentUser);
    const getUserData = async () => {
      try {
        const { data } = await getUser(userId);
        if (isMounted) setUserData(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (chat !== null) getUserData();

    return () => {
      isMounted = false;
    };
  }, [chat, currentUser]);

  // Fetch messages
  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const { data } = await getMessages(chat._id);
        if (isMounted) setMessages(data);
      } catch (error) {
        console.log(error);
      }
    };

    if (chat !== null) fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [chat]);

  // Always scroll to the last message
  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = async (e) => {
    e.preventDefault();
    const message = {
      senderId: currentUser,
      text: newMessage,
      chatId: chat._id,
    };
    const receiverId = chat.members.find((id) => id !== currentUser);
    // Send message to socket server
    setSendMessage({ ...message, receiverId });
    // Send message to database
    try {
      const { data } = await addMessage(message);
      setMessages((prevMessages) => [...prevMessages, data]);
      setNewMessage("");
    } catch {
      console.log("error");
    }
  };

  // Receive message from parent component
  useEffect(() => {
    let isMounted = true;

    console.log("Message Arrived: ", receivedMessage);
    if (receivedMessage !== null && receivedMessage.chatId === chat._id && isMounted) {
      setMessages((prevMessages) => [...prevMessages, receivedMessage]);
    }

    return () => {
      isMounted = false;
    };
  }, [receivedMessage, chat]);

  const scroll = useRef();
  const imageRef = useRef();

  return (
    <>
      <div className="ChatBox-container">
        {chat ? (
          <>
            {/* Chat header */}
            <div className="chat-header">
              <div className="follower">
                <div>
                  <img
                    src={
                      userData?.profilePicture
                        ? `${process.env.REACT_APP_PUBLIC_FOLDER}${userData.profilePicture}`
                        : `${process.env.REACT_APP_PUBLIC_FOLDER}defaultProfile.png`
                    }
                    alt="Profile"
                    className="followerImage"
                    style={{ width: "50px", height: "50px" }}
                  />
                  <div className="name" style={{ fontSize: "0.9rem" }}>
                    <span>
                      {userData?.firstname} {userData?.lastname}
                    </span>
                  </div>
                </div>
              </div>
              <hr style={{ width: "95%", border: "0.1px solid #ececec", marginTop: "20px" }} />
            </div>
            {/* Chat body */}
            <div className="chat-body">
              {messages.map((message) => (
                <div ref={scroll} className={message.senderId === currentUser ? "message own" : "message"}>
                  <span>{message.text}</span> <span>{format(message.createdAt)}</span>
                </div>
              ))}
            </div>
            {/* Chat sender */}
            <div className="chat-sender">
              <div onClick={() => imageRef.current.click()}>+</div>
              <InputEmoji value={newMessage} onChange={handleChange} />
              <div className="send-button button" onClick={handleSend}>Send</div>
              <input type="file" name="" id="" style={{ display: "none" }} ref={imageRef} />
            </div>
          </>
        ) : (
          <span className="chatbox-empty-message">Tap on a chat to start conversation...</span>
        )}
      </div>
    </>
  );
};

export default ChatBox;
