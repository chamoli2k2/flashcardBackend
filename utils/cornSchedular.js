import cron from 'node-cron';
import User from '../models/user.model.js';

cron.schedule('0 0 * * *', async () => { // This cron job runs every day at midnight
  try {
    const now = new Date();
    const usersToDelete = await User.find({
      deletionRequested: true,
      deletionRequestDate: { $lte: new Date(now - 15 * 24 * 60 * 60 * 1000) }, // 15 days ago
    });

    for (let user of usersToDelete) {
      await User.findByIdAndDelete(user._id);
      console.log(`User ${user.username} deleted after 15 days of no login.`);
    }
  } catch (error) {
    console.error("Error deleting users:", error);
  }
});
