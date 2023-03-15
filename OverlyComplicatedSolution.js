{

    init: function(elevators, floors) {

        function stopElevator(elevator,floor,index){
            var floor_num=floor.floorNum();
            //console.log("e:"+index+" prep stopping at:"+floor_num+" q:"+elevator.destinationQueue);
            var floor_index = elevator.destinationQueue.indexOf(floor_num);
            if(floor_index>-1){
                var deleted = elevator.destinationQueue.splice(floor_index,1);
                elevator.checkDestinationQueue();
                //console.log("called splice with index: "+floor_index);
            }
            elevator.goToFloor(floor.floorNum(), true); 
            //console.log("e:"+index+" done prep unschedule stopping at:"+floor_num+" q:"+elevator.destinationQueue);

        }

        function goingUp(elevator,floor,index){
            elevator.goingUpIndicator(true);
            elevator.goingDownIndicator(false);
            stopElevator(elevator,floor,index);
        }

        function goingDown(elevator,floor,index){
            elevator.goingUpIndicator(false);
            elevator.goingDownIndicator(true);  
            stopElevator(elevator,floor,index);
        }

        floors.forEach(function (floor) {
            floor.enRoute = false;

            floor.on("up_button_pressed down_button_pressed", function() {
                floor.lastPress = new Date();
            });

        });       

        elevators.forEach(function(elevator, index) {

            if(elevator.destinationQueue<2){
                elevator.mode="normal";
            }

            elevator.on("stopped_at_floor", function(floorNum) {
                floors[floorNum].enRoute=false;
                //console.log("e:"+index+" stopping at:"+floorNum+" q:"+elevator.destinationQueue);
                 if (elevator.mode=="express"){
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(false);
                }else 
                if(floorNum==floors.length-1){
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                } else if (floorNum == 0){
                    elevator.goingUpIndicator(true);
                    elevator.goingDownIndicator(false);
                }
            });

            elevator.on("floor_button_pressed", function(floorNum) {  
                if (elevator.destinationQueue.indexOf(floorNum) == -1) {
                    elevator.goToFloor(floorNum); 
                    //console.log("e:"+index+" on:"+elevator.currentFloor()+" requested to go to:"+floorNum)
                }
            });

            elevator.on("passing_floor", function(floorNum, direction) { 
                //console.log("e:"+index+" passing:"+floorNum+" q:"+elevator.destinationQueue);
                if (elevator.destinationQueue.indexOf(floorNum) != -1) { 
                    stopElevator(elevator,floors[floorNum],index);
                }else if (elevator.mode=="express"){
                    //console.log("e:"+index+" in express mode :)");
                }else if(elevator.loadFactor() > 0.93 || elevator.destinationQueue.length>4){
                    elevator.mode="express";
                    //console.log("e:"+index+" passing - too full or queue too long...");
                }else if(floors[floorNum].buttonStates.down && direction == "down"){
                    goingDown(elevator,floors[floorNum],index);    
                }else if(floors[floorNum].buttonStates.up && direction == "up"){
                    goingUp(elevator,floors[floorNum],index);
                }
                //console.log("e:"+index+" completed pass:"+floorNum+" q:"+elevator.destinationQueue);
            });

            elevator.on("idle", function() {
                elevator.goingUpIndicator(true);
                elevator.goingDownIndicator(true);
                elevator.mode="normal";
                if (elevator.loadFactor()>0){
                    //this should never happen, but sometimes does... send directionless elevator to lobby
                    console.log("e:"+index+" IS IDLE AND NOT EMPTY (l:"+elevator.loadFactor()+"... STUCK!!!!!");
                    elevator.goingUpIndicator(false);
                    elevator.goingDownIndicator(true);
                    elevator.goToFloor(0);       
                } else {
                    var distance_target, wait_target=floors[0];
                    var min_distance=99;
                    var max_wait=0;
                    var current_date=new Date();
                    for(var i=0; i<floors.length;i++){
                        if(floors[i].buttonStates.down || floors[i].buttonStates.up){
                            if(floors[i].enRoute){
                               continue;
                            }
                            var wait=current_date - floors[i].lastPress;
                            if(wait>max_wait){
                                max_wait=wait;
                                wait_target=floors[i];
                            } 
                            var distance=Math.abs(elevator.currentFloor()-floors[i].floorNum());
                            if(distance<min_distance){
                                min_distance=distance;
                                distance_target=floors[i];
                            }
                        }
                    }
                    var target;
                    //console.log("max wait: "+max_wait+" min distance: "+min_distance);
                    if(max_wait>700){
                        target=wait_target;
                        //console.log("Setting target based on wait. f:"+target.floorNum());
                        target.enRoute=true;
                        elevator.goToFloor(target.floorNum());

                    } else if(min_distance<=2){
                        target=distance_target;
                        //console.log("Setting target based on distance. f:"+target.floorNum());
                        target.enRoute=true;
                        elevator.goToFloor(target.floorNum());

                    } else {
                        floors[0].enRoute=true;
                        elevator.goToFloor(floors[0].floorNum());
                        
                    }
                }
            });
        });

    },
        update: function(dt, elevators, floors) {
            // We normally don't need to do anything here
        }
}
