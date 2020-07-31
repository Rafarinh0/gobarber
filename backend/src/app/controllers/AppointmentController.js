import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

class AppointmentController {
    async index(request, response) {
        const { page = 1 } = request.query;

        const appointments = await Appointment.findAll({
            where: { user_id: request.userId, canceled_at: null },
            order: ['date'],
            limit: 20,
            offset: (page - 1) * 20,
            attributes: ['id', 'date'],
            include: [{
                model: User,
                as: 'provider',
                attributes: ['id', 'name'],
                include: [{
                    model: File,
                    as: 'avatar',
                    attributes: ['id', 'path', 'url']
                }]
            }]
        })

        return response.json(appointments)

    }

    async store(request, response) {
        const schema = Yup.object().shape({
            provider_id: Yup.number().required(),
            date: Yup.date().required(),
        });

        if (!(await schema.isValid(request.body))) {
            return response.status(400).json({ error: 'Validation fails' })
        }

        const { provider_id, date } = request.body;

        //Checar se o provider_id é um provider

        const isProvider = await User.findOne({
            where: { id: provider_id, provider: true },
        });

        if (!isProvider) {
            return response.status(401).json({ error: 'You can only create appointments with providers' });
        }

        //Checar para proibir agendamento de dias passados

        const hourStart = startOfHour(parseISO(date));

        if (isBefore(hourStart, new Date())) {
            return response.status(400).json({ error: 'Past dates are not allowed' })
        }

        //Checar disponibilidade do horário/data

        const checkAvailable = await Appointment.findOne({
            where: {
                provider_id,
                canceled_at: null,
                date: hourStart,
            }
        });

        if (checkAvailable) {
            return response.status(400).json({ error: 'Date is not available' })
        }

        const appointment = await Appointment.create({
            user_id: request.userId,
            provider_id,
            date,
        })

        return response.json(appointment);
    }
}

export default new AppointmentController();