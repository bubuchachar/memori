import svgPaths from "./svg-f3zoapugdy";
import imgImage from "figma:asset/3cdf91d698229a73340ceccbd572010eb8a49daa.png";
import imgTime from "figma:asset/7e15c409f63cf74ea241f7d1ac3be3e12ab8f213.png";
import imgPen from "figma:asset/8bc18219d6089e7d95a22575b5b89dbd200e0229.png";
import imgFood from "figma:asset/eae1e400af5f7ebfbe86427c0176889032656785.png";

function MainPhotoFrame() {
  return (
    <div className="absolute bg-white h-[300px] left-[calc(50%+0.5px)] overflow-clip top-[calc(50%-238px)] translate-x-[-50%] translate-y-[-50%] w-[207px]" data-name="Main Photo Frame">
      <div className="absolute h-[247.5px] left-[calc(50%+0.12px)] pointer-events-none rounded-[12px] top-[calc(50%-0.25px)] translate-x-[-50%] translate-y-[-50%] w-[155.25px]" data-name="Image">
        <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover rounded-[12px] size-full" src={imgImage} />
        <div aria-hidden="true" className="absolute border-4 border-solid border-white inset-[-4px] rounded-[16px] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)]" />
      </div>
    </div>
  );
}

function Place() {
  return (
    <div className="absolute h-[27px] left-[calc(50%+0.5px)] top-[360px] translate-x-[-50%] w-[53px]" data-name="Place">
      <p className="absolute font-['Roboto:Bold',sans-serif] font-bold inset-[0_3.77%_14.81%_0] leading-[normal] text-[20px] text-black text-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Place
      </p>
    </div>
  );
}

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

function InfoContainer() {
  return (
    <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[412px] translate-x-[-50%] w-[370px]" data-name="Info Container">
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

function Component() {
  return (
    <div className="absolute inset-[0_0_0_83.78%]" data-name="Component 1">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60 60">
        <g id="Component 1">
          <path d={svgPaths.p43a0580} fill="var(--fill-0, black)" id="Ellipse 1" />
          <path d={svgPaths.p25564710} fill="var(--fill-0, white)" id="Union" />
        </g>
      </svg>
    </div>
  );
}

function Pen() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Pen">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgPen} />
    </div>
  );
}

function Transport() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Transport">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Transport">
          <path d={svgPaths.p22dab600} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Photos() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Photos">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 36 36">
        <g id="Photos">
          <path d={svgPaths.p37a75900} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Food() {
  return (
    <div className="relative shrink-0 size-[36px]" data-name="Food">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain pointer-events-none size-full" src={imgFood} />
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute content-stretch flex gap-[30px] inset-[20%_28.38%_20%_8.38%] items-center justify-center">
      <Pen />
      <Transport />
      <Photos />
      <Food />
    </div>
  );
}

function Navbar() {
  return (
    <div className="absolute bottom-[20px] h-[60px] left-1/2 translate-x-[-50%] w-[370px]" data-name="Navbar">
      <Component />
      <div className="absolute bg-[rgba(0,0,0,0.1)] inset-[0_20.27%_0_0] rounded-[50px]" />
      <Frame />
    </div>
  );
}

function PenVariant() {
  return (
    <div className="aspect-[96/96] relative shrink-0 w-full" data-name="Pen/Variant3">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain opacity-20 pointer-events-none size-full" src={imgPen} />
    </div>
  );
}

function TransportVariant() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Transport/Variant2">
      <div className="absolute h-[13px] left-1/2 top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%] w-[14px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 13">
          <path d={svgPaths.pe78ea00} fill="var(--fill-0, black)" fillOpacity="0.2" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function PhotosVariant() {
  return (
    <div className="aspect-[24/24] overflow-clip relative shrink-0 w-full" data-name="Photos/Variant1">
      <div className="absolute h-[11px] left-1/2 top-[calc(50%+0.5px)] translate-x-[-50%] translate-y-[-50%] w-[12px]" data-name="Vector">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 11">
          <path d={svgPaths.p303e8600} fill="var(--fill-0, black)" fillOpacity="0.2" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function FoodVariant() {
  return (
    <div className="h-[16px] relative shrink-0 w-full" data-name="Food/Variant3">
      <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-contain opacity-20 pointer-events-none size-full" src={imgFood} />
    </div>
  );
}

function IconContainer() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[16px] items-start left-[22px] top-[559px] w-[16px]" data-name="Icon Container">
      <PenVariant />
      <TransportVariant />
      <PhotosVariant />
      <FoodVariant />
    </div>
  );
}

export default function MemoryDetail() {
  return (
    <div className="bg-white relative size-full" data-name="Memory_Detail">
      <MainPhotoFrame />
      <Place />
      <InfoContainer />
      <Navbar />
      <IconContainer />
    </div>
  );
}