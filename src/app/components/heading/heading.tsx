import Typography from "../typography/typography";

type HeadingProps = {
  text: string;
};

export default function Heading({ text }: HeadingProps): React.JSX.Element {
  return (
    <Typography as="h1" variant="headingLarge">
      {text}
    </Typography>
  );
}
