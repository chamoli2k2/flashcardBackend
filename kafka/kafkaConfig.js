import { EventHubProducerClient, EventHubConsumerClient } from '@azure/event-hubs';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.EVENT_HUBS_CONNECTION_STRING; // Your Event Hubs connection string
const eventHubName = process.env.EVENT_HUB_NAME; // Your Event Hub name
const consumerGroup = process.env.CONSUMER_GROUP_NAME; // Your consumer group name


const producer = new EventHubProducerClient(connectionString, eventHubName);
const consumer = new EventHubConsumerClient(consumerGroup, connectionString, eventHubName);

export { producer, consumer };