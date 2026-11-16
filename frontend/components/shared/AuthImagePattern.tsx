
type Props = {
    title: string;
    subtitle: string
}


const AuthImagePattern = ({ title, subtitle }: Props) => {
    return (
        <div className="hidden lg:flex items-center justify-center p-12">
            <div className="max-w-md text-center">
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[...Array(9)].map((_, i) => (
                        <div
                            key={i}
                            className={`aspect-square rounded-2xl glass-panel ${i % 2 === 0 ? "animate-pulse" : ""
                                }`}
                        />
                    ))}
                </div>
                <h2 className="text-2xl font-bold mb-4 text-pearl">{title}</h2>
                <p className="text-dim">{subtitle}</p>
            </div>
        </div>
    );
};

export default AuthImagePattern;
