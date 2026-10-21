export function PhoneFrame({ src, alt, large = false }: { src: string; alt: string; large?: boolean }) {
  return (
    <div className={large ? 'ag-phone ag-phone-lg' : 'ag-phone'}>
      <div className="ag-phone-screen">
        <img src={src} alt={alt} width={720} height={1280} className="ag-phone-shot" />
      </div>
    </div>
  );
}
