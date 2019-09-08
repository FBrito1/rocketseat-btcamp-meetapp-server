import Subscription from '../models/Subscription';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Queue from '../../lib/Queue';
import ConfirmationMail from '../jobs/ConfirmationMail';

class SubscriptionController {
  async store(req, res) {
    const { meetupId } = req.params;

    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(meetupId);

    if (meetup.user_id === req.userId) {
      return res.status(401).json({
        error: 'You cannot register to your own meetups',
      });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'This meetup already happend',
      });
    }

    const alreadySub = await Subscription.findOne({
      where: { meetup_id: meetupId, user_id: req.userId },
    });

    if (alreadySub) {
      return res.status(400).json({
        error: 'You already register for this meetup',
      });
    }

    const checkMeetupDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          as: 'meetup',
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkMeetupDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });

    const meetupOwner = await User.findByPk(meetup.user_id);

    await Queue.add(ConfirmationMail.key, {
      user,
      meetup,
      owner: meetupOwner,
    });

    return res.json(subscription);
  }
}

export default new SubscriptionController();
