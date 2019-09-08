import * as Yup from 'yup';
import { Op } from 'sequelize';
import {
  startOfHour,
  parseISO,
  isBefore,
  startOfDay,
  endOfDay,
} from 'date-fns';

import Meetup from '../models/Meetup';

import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { page = 1, date } = req.query;
    const where = {};

    if (date) {
      const searchDate = parseISO(date);
      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }

    const meetups = await Meetup.findAll({
      where,
      order: ['date'],
      attributes: ['id', 'title', 'description', 'locale', 'date'],
      limit: 10,
      offset: (page - 1) * 10,
      include: [
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

  async update(req, res) {
    const { meetupId } = req.params;

    const schema = Yup.object().shape({
      title: Yup.string(),
      description: Yup.string(),
      locale: Yup.string(),
      date: Yup.date(),
      image: Yup.number().integer(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        error: 'Validation fails',
      });
    }

    const { date } = req.body;

    if (date) {
      const hourStart = startOfHour(parseISO(date));

      if (isBefore(hourStart, new Date())) {
        return res.status(400).json({
          error: 'Invalid date',
        });
      }
    }

    const meetup = await Meetup.findByPk(meetupId);

    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: 'You dont have permission to update this meetup',
      });
    }

    if (meetup.past) {
      return res.status(400).json({
        error: 'Cannot update past meetups',
      });
    }

    const teste = await meetup.update(req.body);

    return res.json(teste);
  }

  async delete(req, res) {
    const { meetupId } = req.params;

    const meetup = await Meetup.findByPk(meetupId);

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
