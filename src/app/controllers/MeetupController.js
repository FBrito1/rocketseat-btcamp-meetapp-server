import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const meetups = await Meetup.findAll({
      where: { user_id: req.userId },
      order: ['date'],
      attributes: ['id', 'title', 'description', 'locale'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
        {
          model: File,
          as: 'bannerFile',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    return res.json(meetups);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      title: Yup.string().required(),
      description: Yup.string().required(),
      locale: Yup.string().required(),
      date: Yup.date().required(),
      image: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        error: 'Validation fails',
      });
    }

    const { title, description, locale, date, image } = req.body;

    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({
        error: 'You cannot cancel past meetups',
      });
    }

    const meetup = await Meetup.create({
      title,
      description,
      locale,
      date,
      banner: image,
      user_id: req.userId,
    });

    return res.json(meetup);
  }

  async delete(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You dont have permission to cancel this meetup',
      });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'Cannot cancel past meetups',
      });
    }

    await Meetup.destroy({ where: { id: meetupId } });

    return res.json({ message: 'success' });
  }
}

export default new MeetupController();
