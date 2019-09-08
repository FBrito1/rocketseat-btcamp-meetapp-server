import Mail from '../../lib/Mail';

class ConfirmationMail {
  get key() {
    return 'ConfirmationMail';
  }

  async handle({ data }) {
    const { owner, user, meetup } = data;

    await Mail.sendMail({
      to: `${owner.name} <${owner.email}>`,
      subject: 'Nova inscrição',
      template: 'subscription',
      context: {
        owner: owner.name,
        user: user.name,
        meetup: meetup.title,
      },
    });
  }
}

export default new ConfirmationMail();
