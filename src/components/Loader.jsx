/**
 * Loader — reusable spinner component
 *
 * Props:
 *  variant  - 'page'    : fills the viewport (auth / full-page loading screens)
 *             'section' : min-h-[300px] centered block inside a content area  (default)
 *             'inline'  : tiny 20px spinner for use inside buttons / badges
 *  text     - optional label shown below the spinner (page & section variants)
 *  className - extra classes forwarded to the outer wrapper
 */
export default function Loader({ variant = 'section', text, className = '' }) {
  const spinnerSizes = {
    page:    'w-10 h-10 border-4',
    section: 'w-10 h-10 border-4',
    inline:  'w-5 h-5 border-2',
  };

  const spinner = (
    <div
      className={`
        ${spinnerSizes[variant]}
        border-gray-200 border-t-primary-500
        rounded-full animate-spin
      `}
    />
  );

  if (variant === 'inline') {
    return spinner;
  }

  const wrapperBase = variant === 'page'
    ? 'flex flex-col items-center justify-center min-h-screen gap-4 text-gray-500'
    : 'flex flex-col items-center justify-center min-h-[300px] gap-4 text-gray-500';

  return (
    <div className={`${wrapperBase} ${className}`}>
      {spinner}
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
}
