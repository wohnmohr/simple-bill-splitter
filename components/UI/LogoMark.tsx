/**
 * SplitBiller's mark. Dark group themes swap in the light version (see
 * applyTheme); it's lazy, so it only loads when a dark theme shows it.
 */
export const LogoMark = () => (
	<>
		<img src="/logo-mark.webp" alt="" width={35} height={30} className="logo-mark h-[30px] w-[35px] shrink-0 object-contain" />
		<img src="/logo-mark-light.webp" alt="" width={35} height={30} loading="lazy" className="logo-mark-light h-[30px] w-[35px] shrink-0 object-contain" />
	</>
);
