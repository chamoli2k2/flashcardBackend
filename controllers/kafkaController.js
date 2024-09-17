import { producer, consumer } from '../kafka/kafkaConfig.js';
import { saveFlashcardToDatabase } from './redisController.js'; // Assuming this is where the DB save logic is

// Initialize the Event Hubs producer
export const initProducer = async () => {
  try {
    console.log('Event Hubs Producer initialized');
  } catch (error) {
    console.error('Error initializing Event Hubs Producer:', error);
  }
};

// Send a message to Event Hubs
const sendMessage = async (message) => {
  try {
    const batch = await producer.createBatch();
    batch.tryAdd({ body: JSON.stringify(message) });

    await producer.sendBatch(batch);
    console.log('Message sent to Event Hubs');
  } catch (error) {
    console.error('Error sending message to Event Hubs:', error);
  }
};

// Example usage for sending a flashcard creation message
export const sendFlashcardCreation = async (userId, flashcardId, flashcardData) => {
  const message = {
    userId,
    flashcardId,
    flashcardData,
    status: 'CREATED' // Include status to indicate creation
  };
  await sendMessage(message);
};

// Example usage for sending a flashcard deletion message
export const sendFlashcardDeletion = async (userId, flashcardId) => {
  const message = {
    userId,
    flashcardId,
    status: 'DELETED' // Include status to indicate deletion
  };
  await sendMessage(message);
};

// Initialize and run the Event Hubs consumer
export const initConsumer = async () => {
  try {
    const subscription = consumer.subscribe({
      processEvents: async (events, context) => {
        for (const event of events) {
          try {
            const parsedMessage = JSON.parse(event.body);
            const { userId, flashcardId, flashcardData, status } = parsedMessage;

            if (status === 'DELETED') {
              // Handle flashcard deletion (e.g., log or update some system state)
              console.log(`Skipping insertion for deleted flashcard: ${flashcardId}`);
            } else if (status === 'CREATED') {
              // Save flashcard to the database after a delay
              setTimeout(async () => {
                await saveFlashcardToDatabase(userId, flashcardId, flashcardData);
              }, 3600000); // 1-hour delay
            }
          } catch (error) {
            console.error('Error processing Event Hubs message:', error);
          }
        }
      },
      processError: async (err, context) => {
        console.error('Error processing events:', err);
      }
    });

    console.log('Event Hubs Consumer running');

    // To stop receiving events, you can call subscription.close() when needed
    // await subscription.close();
  } catch (error) {
    console.error('Error initializing Event Hubs Consumer:', error);
  }
};

export default { initProducer, sendFlashcardCreation, sendFlashcardDeletion, initConsumer };
