import Image from 'next/image';

type LogoProps = {
  width?: number;
  height?: number;
  className?: string;
};

export const Logo = ({ width = 200, height = 120, className }: LogoProps) => {
  return (
    <div className={className}>
      <Image
        src="/images/logo.png"
        alt="Exclusive Algarve Villas"
        width={width}
        height={height}
        priority
      />
    </div>
  );
};