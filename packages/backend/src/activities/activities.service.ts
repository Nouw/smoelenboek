import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CommitteesService } from 'src/committees/committees.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { Repository } from 'typeorm';
import { FormQuestionItem } from './form/entities/form-question-item.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activitiesRepository: Repository<Activity>,
    private readonly committeesService: CommitteesService,
  ) {}

  async create(createActivityDto: CreateActivityDto) {
    const activity = createActivityDto.activity;

    const committee = await this.committeesService.findOne(
      createActivityDto.committee,
    );

    const form = createActivityDto.form;
    form.questions = [];

    activity.form = form;
    activity.commitee = committee;

    for (const question of createActivityDto.form.questions) {
      //we don't have question items then
      const items = [];
      if (question.type !== 'text') {
        for (const item of question.items) {
          const questionItem: FormQuestionItem = item;
          questionItem.question = question;
          items.push(questionItem);
        }
      }
      question.items = items;

      form.questions.push(question);
    }

    return this.activitiesRepository.save(activity);
  }

  findAll() {
    return this.activitiesRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} activity`;
  }

  update(id: number, updateActivityDto: UpdateActivityDto) {
    return `This action updates a #${id} activity`;
  }

  remove(id: number) {
    return `This action removes a #${id} activity`;
  }
}
