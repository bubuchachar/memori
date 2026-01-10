import svgPaths from "./svg-o6lsqnei3u";
import imgTime from "figma:asset/7e15c409f63cf74ea241f7d1ac3be3e12ab8f213.png";

function Date() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Date">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Date">
          <rect fill="white" height="24" width="24" />
          <path d={svgPaths.p24a80a00} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Date1() {
  return (
    <div className="h-[22px] relative shrink-0 w-[36px]" data-name="Date">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal inset-[0_-125%_13.64%_0] leading-[normal] text-[16px] text-black text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        01.01.2026
      </p>
    </div>
  );
}

function DateContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-[110px]" data-name="Date Container">
      <Date />
      <Date1 />
    </div>
  );
}

function Feelings() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Feelings">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g clipPath="url(#clip0_1_445)" id="Feelings">
          <g id="Vector"></g>
          <path d={svgPaths.p3a464800} fill="var(--fill-0, black)" id="Vector_2" />
          <path d={svgPaths.p325b55a0} fill="var(--fill-0, black)" id="Vector_3" />
          <path d={svgPaths.p2955d40} fill="var(--fill-0, black)" id="Vector_4" />
        </g>
        <defs>
          <clipPath id="clip0_1_445">
            <rect fill="white" height="24" width="24" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Date2() {
  return (
    <div className="h-[22px] relative shrink-0 w-[36px]" data-name="Date">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal inset-[0_-75%_13.64%_0] leading-[normal] text-[16px] text-black text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Amazing
      </p>
    </div>
  );
}

function AmazingContainer() {
  return (
    <div className="content-stretch flex gap-[4px] items-end relative shrink-0 w-[94px]" data-name="Amazing Container">
      <Feelings />
      <Date2 />
    </div>
  );
}

function Time() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Time">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgTime} />
    </div>
  );
}

function Date3() {
  return (
    <div className="h-[22px] relative shrink-0 w-[36px]" data-name="Date">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal inset-[0_-8.33%_13.64%_0] leading-[normal] text-[16px] text-black text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Night
      </p>
    </div>
  );
}

function NightContainer() {
  return (
    <div className="content-stretch flex items-end relative shrink-0 w-[66px]" data-name="Night Container">
      <Time />
      <Date3 />
    </div>
  );
}

export default function InfoContainer() {
  return (
    <div className="content-stretch flex items-center justify-between relative size-full" data-name="Info Container">
      <DateContainer />
      <div className="h-[19px] relative shrink-0 w-0">
        <div className="absolute inset-[-2.63%_-0.5px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 20">
            <path d="M0.5 0.5V19.5" id="Vector 1" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeOpacity="0.5" />
          </svg>
        </div>
      </div>
      <AmazingContainer />
      <div className="h-[19px] relative shrink-0 w-0">
        <div className="absolute inset-[-2.63%_-0.5px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 20">
            <path d="M0.5 0.5V19.5" id="Vector 1" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeOpacity="0.5" />
          </svg>
        </div>
      </div>
      <NightContainer />
    </div>
  );
}