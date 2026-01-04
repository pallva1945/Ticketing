                        <div className="mb-8">
                            <div className="flex justify-between items-end mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Venue Intelligence</h2>
                            </div>
                            
                            {/* Map and Vertical Widgets Row */}
                            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
                                {/* Map Area - Slimmer (8/12 = 66%) */}
                                <div className="xl:col-span-8 h-[600px]">
                                    <ArenaMap 
                                        data={viewData} 
                                        onZoneClick={handleZoneClick} 
                                        selectedZone={selectedZones.includes('All') ? 'All' : selectedZones[0]} 
                                    />
                                </div>

                                {/* Vertical Widgets Column - Wider (4/12 = 33%) */}
                                <div className="xl:col-span-4 flex flex-col gap-4 h-[600px]">
                                    {/* 70% Height */}
                                    <div className="flex-[7] min-h-0">
                                        <DistressedZones data={viewData} />
                                    </div>
                                    {/* 30% Height */}
                                    <div className="flex-[3] min-h-0">
                                        <CompKillerWidget data={viewData} />
                                    </div>
                                </div>
                            </div>

                            {/* Full Width Zone Table */}
                            <div className="h-[600px] w-full">