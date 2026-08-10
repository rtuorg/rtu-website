 jssor_1_slider_init = function() {

            var jssor_1_SlideshowTransitions = [
              {$Duration:1200,$Opacity:2}
            ];

            var jssor_1_SlideoTransitions = [
              [{b:0,d:1160,x:783,y:3}],
              [{b:260,d:780,x:-869,y:18}],
              [{b:1160,d:840,x:667,y:2}],
              [{b:2020,d:760,x:-11,y:-315}],
              [{b:2780,d:520,x:-272,y:-6}],
              [{b:3300,d:640,x:-3,y:-145}],
              [{b:0,d:700,x:307,y:-1,i:2}],
              [{b:0,d:700,x:-851,y:-5,i:1}],
              [{b:700,d:800,x:-827,y:-11}],
              [{b:1500,d:500,x:-10,y:-114}],
              [{b:2000,d:500,x:-9,y:141}],
              [{b:2000,d:420,x:14,y:-158}],
              [{b:2500,d:1100,x:-281}],
              [{b:0,d:800,x:-870,y:3}],
              [{b:800,d:500,x:7,y:112}],
              [{b:800,d:500,x:103,y:-202}],
              [{b:1300,d:900,x:12,y:-264}],
              [{b:2200,d:1000,x:-450,y:5}]
            ];

            var jssor_1_options = {
              $AutoPlay: true,
              $SlideshowOptions: {
                $Class: $JssorSlideshowRunner$,
                $Transitions: jssor_1_SlideshowTransitions,
                $TransitionsOrder: 1
              },
              $CaptionSliderOptions: {
                $Class: $JssorCaptionSlideo$,
                $Transitions: jssor_1_SlideoTransitions
              },
              $ArrowNavigatorOptions: {
                $Class: $JssorArrowNavigator$
              },
              $BulletNavigatorOptions: {
                $Class: $JssorBulletNavigator$
              }
            };

            var jssor_1_slider = new $JssorSlider$("jssor_1", jssor_1_options);

            /*responsive code begin*/
            /*you can remove responsive code if you don't want the slider scales while window resizing*/
            function ScaleSlider() {
                var refSize = jssor_1_slider.$Elmt.parentNode.clientWidth;
                if (refSize) {
                    refSize = Math.min(refSize, 1400);
                    jssor_1_slider.$ScaleWidth(refSize);
                }
                else {
                    window.setTimeout(ScaleSlider, 30);
                }
            }
            ScaleSlider();
            $Jssor$.$AddEvent(window, "load", ScaleSlider);
            $Jssor$.$AddEvent(window, "resize", ScaleSlider);
            $Jssor$.$AddEvent(window, "orientationchange", ScaleSlider);
            /*responsive code end*/
        };