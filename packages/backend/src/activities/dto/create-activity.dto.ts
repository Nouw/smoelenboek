import { Activity } from '../entities/activity.entity';
import { Form } from '../form/entities/form.entity';

export class CreateActivityDto {
  activity: Activity;
  form: Form;
  committee: number;
}
