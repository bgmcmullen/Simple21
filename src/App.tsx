import { FormEvent, ChangeEvent, useState, useEffect } from 'react'
import Button from '@mui/material/Button';

import './App.scss'

const API_URL: string | URL = import.meta.env.VITE_API_URL

interface Card {
  card_value: string | number;
  card_suite: string;
}

interface CardsState {
  user_hidden_card_value: Card[];
  user_visible_card_total_values: Card[];
  computer_hidden_card_value: Card[];
  computer_visible_card_total_values: Card[];
}

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketOpen, setSocketOpen] = useState(false);
  // const [intructions, setIntructions] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [showNameInput, setShowNameInput] = useState<boolean>(false);
  const [cards, setCards] = useState<CardsState>({
    'computer_hidden_card_value': [],
    'computer_visible_card_total_values': [],
    'user_hidden_card_value': [],
    'user_visible_card_total_values': []
  });
  const [welcomeText, setWelcomeText] = useState<string>('');
  const [winnerText, setWinnerText] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState<boolean>(false)
  const [messageQueue, setMessageQueue] = useState<string[]>([])


  // WebSocket setup
  useEffect(() => {
    const socketInstance = new WebSocket(API_URL);

    // Event listener for receiving messages
    socketInstance.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const type = data.type;
      const payload = data.payload;
      switch (type) {
        case 'set_instructions':
          // setIntructions(payload);
          setShowNameInput(true);
          break;
        case "welcome_user":
          setWelcomeText(payload);
          break;
        case "print_status":
          setCards(payload);
          break;
        case "game_end":
          setGameOver(true);
          setWinnerText(payload);
          break;
      }
    };

    // Handle the open event and enable sending messages
    socketInstance.addEventListener('open', () => {
      setSocketOpen(true);
      console.log('WebSocket connection opened.');
    });

    socketInstance.addEventListener('close', () => {
      console.log('WebSocket connection closed.');
    });

    setSocket(socketInstance); // Store WebSocket instance

    // Clean up the WebSocket on component unmount
    return () => {
      socketInstance.close();
    };
  }, []); // Run only once when component mounts

  // Handle message sending with queue
  useEffect(() => {
    const sendMessage = async () => {
      if (socketOpen && messageQueue.length > 0 && socket) {
        const message = messageQueue[0]; // Get the first message in the queue

        // Try sending the message
        try {
          socket.send(message);
          setMessageQueue(prevMessageQueue => prevMessageQueue.slice(1)); // Remove the sent message from the queue
        } catch (error) {
          console.log("Failed to send message:", error);
        }
      }
    };

    sendMessage();
  }, [messageQueue, socketOpen, socket]);





  useEffect(() => {

    // Select all cards and the deck
    const cardsOnScreen = document.querySelectorAll('.card, .card-paused');
    const deck = document.getElementById('deck');

    // Get the deck's position
    const deckRect = deck?.getBoundingClientRect();


    cardsOnScreen.forEach((card, index) => {
      const cardElement = card as HTMLElement; // Cast to HTMLElement
      const cardRect = cardElement.getBoundingClientRect();

      // Calculate the differences in position

      if (!deckRect)
        return;
      const startX = deckRect.left - cardRect.left;
      const startY = deckRect.top - cardRect.top;

      // Set the CSS variables for the animation
      cardElement.style.setProperty('--start-x', `${startX}px`);
      cardElement.style.setProperty('--start-y', `${startY}px`);

      // Set the animation delay for staggering
      const delay = index * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--delay-step'));
      cardElement.style.animationDelay = `${delay}s`;


    });
  }, [cards]);


  async function handleStart() {

    const message = JSON.stringify({
      'type': 'get_instructions',
      'payload': ''
    });
    setMessageQueue(prevMessageQueue => [...prevMessageQueue, message]);
  }

  function handleChangeName(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  async function handleSubmitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nameMessage = JSON.stringify({
      'type': 'set_name',
      'payload': name
    });

    setMessageQueue(prevMessageQueue => [...prevMessageQueue, nameMessage]);

    const runMessage = JSON.stringify({
      'type': 'run',
      'payload': ''
    });

    setMessageQueue(prevMessageQueue => [...prevMessageQueue, runMessage]);
  }

  function handleTakeACard() {
    const takeCardMessage = JSON.stringify({
      'type': 'take_a_card',
      'payload': ''
    });
    setMessageQueue(prevMessageQueue => [...prevMessageQueue, takeCardMessage]);
  }

  function handleStand() {
    const standMessage = JSON.stringify({
      'type': 'stand',
      'payload': ''
    });
    setMessageQueue(prevMessageQueue => [...prevMessageQueue, standMessage]);
  }

  const suiteClasses: { [key in Card['card_suite']]: string } = {
    hearts: '♥',
    spades: '♠',
    diamonds: '♦',
    clubs: '♣',
  };

  return (
    <>
      <div>
        <Button variant="contained" onClick={handleStart}>Start</Button>
        {showNameInput && <form onSubmit={handleSubmitName}>
          <input type="text" placeholder="Enter Your Name" onChange={handleChangeName}></input>
          <Button type="submit" variant="contained" color="primary">
            Submit Name
          </Button>
        </form>}
        <div>
          {welcomeText}

          {/* <p key={`${indexI} p`}>{key}</p> */}

          {/* {
              value.map((card: { card_value: string; card_suite: string; }, indexJ: number) => {
                const cardValue: string = card.card_value;
                const cardSuite: string = card.card_suite;
                return (
                  key === 'computer_hidden_card_value' && !gameOver ? <div className="card card-back"></div> :
                    <div key={`${indexI} ${indexJ} div`} className={`card ${cardSuite}`}>
                      <div key={`${indexI} ${indexJ} divT`} className="top-left">{cardValue}</div>
                      <div key={`${indexI} ${indexJ} divS`} className="suit">{suiteClasses[cardSuite]}</div>
                      <div key={`${indexI} ${indexJ} divB`} className="bottom-right">{cardValue}</div>
                    </div>)
              })
            } */}
          <p>{name && `${name}'s cards:`}</p>
          <div className="card-container">
            {cards.user_hidden_card_value.map(card => {
              return (
                <div className={`card ${card.card_suite}`}>
                  <div className="top-left">{card.card_value}</div>
                  <div className="suit">{suiteClasses[card.card_suite]}</div>
                  <div className="bottom-right">{card.card_value}</div>
                </div>
              )
            })}
            {cards.user_visible_card_total_values.map((card, index) => {
              return (
                <div className={`${index === 0 ? 'card-paused' : 'card'} ${card.card_suite}`}>
                  <div className="top-left">{card.card_value}</div>
                  <div className="suit">{suiteClasses[card.card_suite]}</div>
                  <div className="bottom-right">{card.card_value}</div>
                </div>
              )
            })
            }
          </div>
          <p>Computer's cards:</p>
          <div className="card-container">
            {cards.computer_hidden_card_value.map(card => {
              return (
                gameOver ?
                  (<div className={`card ${card.card_suite}`}>
                    <div className="top-left">{card.card_value}</div>
                    <div className="suit">{suiteClasses[card.card_suite]}</div>
                    <div className="bottom-right">{card.card_value}</div>
                  </div>) : (<div className="card  card-back"></div>)

              )
            })}
            {cards.computer_visible_card_total_values.map((card) => {
              return (
                <div className={`${gameOver ? "card" : "card-paused"} ${card.card_suite}`}>
                  <div className="top-left">{card.card_value}</div>
                  <div className="suit">{suiteClasses[card.card_suite]}</div>
                  <div className="bottom-right">{card.card_value}</div>
                </div>
              )
            })
            }
          </div>
          <div className="deck" id="deck"></div>


          {winnerText.map(line => <p>{line}</p>)}
          <Button variant="contained" onClick={handleTakeACard}>Hit</Button>
          <Button variant="contained" onClick={handleStand}>Stand</Button>

        </div>
      </div>
    </>
  )
}

export default App
