type Props = {
  name: string;
  imageSrc: string;
  description: string;
};

export function FounderCard({
  name,
  imageSrc,
  description,
}: Props) {
  return (
    <div className="mb-8 p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-shrink-0">
          <img
            src={imageSrc}
            alt={`${name}, Founder`}
            className="w-30 h-30 md:w-40 md:h-40 object-cover rounded-full shadow-lg"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-foreground text-xl mb-3">
            {name}
          </h4>
          <p className="text-muted-foreground leading-relaxed text-lg">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
