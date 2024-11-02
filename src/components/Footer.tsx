
const Footer = () => {
  return (
    <footer className="mt-20 border-t bg-white/50">
      <div className=" mx-auto px-4 py-12 justify-between">
        <div className=" text-center text-sm text-gray-600">
          © {new Date().getFullYear()} VizMuz. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
