function Facalities() {
  const facalities = [
    {
      id: 1,
      img: "images/fas-icon-1.png",
    },
    {
      id: 2,
      img: "images/fas-icon-2.png",
    },
    {
      id: 3,
      img: "images/fas-icon-1.png",
    },
    {
      id: 4,
      img: "images/fas-icon-2.png",
    },
    {
      id: 5,
      img: "images/fas-icon-1.png",
    },
    {
      id: 6,
      img: "images/fas-icon-2.png",
    },
    {
      id: 7,
      img: "images/fas-icon-1.png",
    },
    {
      id: 8,
      img: "images/fas-icon-2.png",
    },
  ];
  return (
    <>
      <div className="max-w-7xl mx-auto pt-8">
        {/* Mobile slider */}
        <div className="md:hidden px-3">
          <div
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {facalities.map((items, index) => (
              <div
                key={index}
                className="min-w-[22%] flex items-center justify-center"
              >
                <img
                  src={items.img}
                  className="w-16 h-16 object-contain"
                  alt="facalities"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop/tablet grid */}
        <div className="hidden md:grid lg:grid-cols-8 md:grid-cols-4 grid-cols-2 gap-4 p-8">
          {facalities.map((items, index) => (
            <img
              src={items.img}
              className="w-20 h-20 md:w-full md:h-full lg:w-full lg:h-full  mx-auto object-contain"
              key={index}
              alt="facalities"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </>
  );
}
export default Facalities;
