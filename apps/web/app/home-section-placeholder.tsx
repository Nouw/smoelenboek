import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import type { HomeNavigationItem } from './home-navigation';

export function SectionPlaceholder({
  label,
  description,
  item,
}: {
  label: string;
  description: string;
  item: HomeNavigationItem;
}) {
  return (
    <Card className="rounded-lg shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md">
            <item.icon className="size-5" />
          </div>
          <div>
            <CardTitle>{label}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
