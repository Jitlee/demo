(function($) {
	var defaults = {
		dayIds: "日一二三四五六",
		firstDay: 0, // 从星期天0开始
		weekends: true, // 是否显示周末
	};
	
	var GC = $.fn.gmCalendar = function(options) {
		var res = this;
		var args = Array.prototype.slice.call(arguments, 1);
		this.each(function(i, element) {
			var $this = $(this);
			var calendar = $this.data("calendar");
			if(typeof options === "string") {
				if(calendar && $.isFunction(calendar[options])) {
					var singleRes = calendar[options].apply(calendar, args);
					if(!i) {
						res = singleRes;
					}
					
					if(options === "destroy") {
						$this.removeData("calendar");
					}
				}
			} else if(!calendar) {
				options = $.extend({}, GC.defaults, options);
				calendar = new Calendar($this, options);
				$this.data("calendar", calendar);
				calendar.render();
			}
		});
		return res;
	};
	GC.defaults = defaults;
	
	// 获取指定年月的最大天数
	function daysInMonth(m, y){
		m++;
		return m===2?y&3||!(y%25)&&y&15?28:29:30+(m+(m>>3)&1);
	}
	var lunarCalendar = new LunarCalendar();
	// 日历类
	var Calendar = Class({
		options: null,
		div: null,
		body: null,
		tools: null,
		renderer: null,
		date: null,
		lastDate: null,
		init: function(element, options) {
			this.element = element;
			this.body = $("<div class=\"gm-calendar-body\">").appendTo(element);
			this.tools = $(".gm-calendar-tools", element);
			this.options = options;
			this.date = this.options.date || new Date;
			if(typeof this.date == "number") {
				this.date = new Date(this.date);
			} else if(!(this.date instanceof Date)) {
				throw "请输入正确的日期";
				return;
			}
			this.renderer = new CalendarMonthRenderer(this);
		},
		
		// 显示
		render: function() {
			if(this.renderer) {
				this.renderer.render();
				this.onPage();
			}
		},
		
		bindData: function(callback) {
			if(this.renderer) {
				this.renderer.bindData(callback);
			}
		},
		
		getCell: function(monthType, day, callback) {
			if(this.renderer) {
				this.renderer.getCell(monthType, day, callback);
			}
		},
		
		today: function() {
			this.gotoDate(new Date());
		},
		
		lastYear: function() {
			var date = this.date;
			var lastYear = new Date(date.getFullYear() - 1, date.getMonth(), 1);
			var daysOfMonth = daysInMonth(lastYear.getMonth(), lastYear.getFullYear());
			lastYear = new Date(lastYear.getFullYear(), lastYear.getMonth(), Math.min(daysOfMonth, date.getDate()));
			this.gotoDate(lastYear);
		},
		
		lastMonth: function() {
			var date = this.date;
			var lastMonth = new Date(date.getFullYear(), date.getMonth(), 1);
			lastMonth = new Date(lastMonth.getTime() - 2*24*3600*1000);
			var daysOfMonth = daysInMonth(lastMonth.getMonth(), lastMonth.getFullYear());
			lastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), Math.min(daysOfMonth, date.getDate()));
			this.gotoDate(lastMonth);
		},
		
		nextMonth: function() {
			var date = this.date;
			var daysOfMonth = daysInMonth(date.getMonth(), date.getFullYear());
			var nextMonth = new Date(date.getFullYear(), date.getMonth(), daysOfMonth);
			nextMonth = new Date(nextMonth.getTime() + 3*24*3600*1000);
			daysOfMonth = daysInMonth(nextMonth.getMonth(), nextMonth.getFullYear());
			nextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(daysOfMonth, date.getDate()));
			this.gotoDate(nextMonth);
		},
		
		nextYear: function() {
			var date = this.date;
			var nextYear = new Date(date.getFullYear() + 1, date.getMonth(), 1);
			var daysOfMonth = daysInMonth(nextYear.getMonth(), nextYear.getFullYear());
			nextYear = new Date(nextYear.getFullYear(), nextYear.getMonth(), Math.min(daysOfMonth, date.getDate()));
			this.gotoDate(nextYear);
		},
		
		// 前往日期
		gotoDate: function(newDate) {
			this.date = newDate;
			if(this.renderer) {
				this.renderer.renderDate();
			}
			if(!this.lastDate
				|| (this.lastDate.getMonth() != newDate.getMonth() 
				||this.lastDate.getFullYear() != newDate.getFullYear())) {
				this.onPage();
			}
			this.lastDate = newDate;
		},
		
		// 获取日期
		getDate: function() {
			return this.date;
		},
		
		onPage: function() {
			if(this.options.callbacks && $.isFunction(this.options.callbacks.page)) {
				var lunar = lunarCalendar.convert(this.date);
				this.options.callbacks.page.apply(this, [lunar]);
			}	
		},
		
		// 销毁
		destory: function() {
			
		}
	});
	
	// 日历渲染类
	var CalendarRenderer = Class({
		calendar: null,
		table: null,
		tips: null,
		init: function(calendar) {
			this.calendar = calendar;
		},
		
		// 显示
		render: function() {
			this.renderDate();
		},
		
		renderDate: function() {
			
		},
		
		destroy: function() {
			if(table) {
				table.remove();
				table = null;
			}
		},
	});
	
	// 按月渲染类
	var CalendarMonthRenderer = Class(CalendarRenderer, {
		init: function() {
			CalendarRenderer.prototype.init.apply(this, arguments);
			
			this.initEvents();
		},
		
		render: function() {
			if(!this.table) {
				this.createTable();
				this.createTips();
			}
			CalendarRenderer.prototype.render.apply(this, arguments);
		},
		
		// 创建表格
		createTable: function() {
			var parentElement = this.calendar.body.empty();
			var options = this.calendar.options;
			var table = $("<table class=\"gm-calendar-table\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">").appendTo(parentElement);
			var thead = $("<thead>").appendTo(table);
			var tbody = $("<tbody>").appendTo(table);
			this.createTableHead(thead, options);
			this.createTableBody(tbody, options);
			this.table = table;
		},
		
		createTips: function() {
			if(!this.tips) {
				var options = this.calendar.options;
				var parentElement = this.calendar.body;
				this.tips = $("<div class=\"gm-calendar-tips\"></div>").appendTo(parentElement);
				if(options.renderCallbacks && options.renderCallbacks.createTips) {
					options.renderCallbacks.createTips.apply(this, [this.tips]);
				} else {
					this.tips.append("<p class=\"gm-date\">");
					this.tips.append("<p class=\"gm-week\">");
					this.tips.append("<p class=\"gm-lunar\">");
					this.tips.append("<p class=\"gm-content\">");
				}
			
			}
		},
		
		// 创建星期行
		createTableHead: function(thead, options) {
			var firstDay = (options.firstDay > 0 && options.firstDay < 7) ? options.firstDay : 0;
			var weekends = options.weekends !== false;
			for(var i = 0; i < 7; i++) {
				var day = (firstDay + i)%7;
				if(!weekends && (day == 0 || day == 6)) {
					continue;
				}
				thead.append("<th>星期" + options.dayIds.charAt(day) + "</th>");
			}
		},
		
		// 创建日期格子
		createTableBody: function(tbody, options) {
			var weekends = options.weekends !== false;
			var columns =  weekends ? 7 : 5;
			for(var row = 0; row < 6; row++) {
				var tr = $("<tr>").appendTo(tbody);
				for(var col = 0; col < columns; col++) {
					tr.append("<td>");
				}
			}
		},
		
		// 处理事件
		initEvents: function() {
			var renderer = this;
			var options = this.calendar.options;
			if(!(options.callbacks && options.callbacks.click === false)) {
				// 点击
				this.calendar.body.on("click", "td", function() {
					var $this = $(this);
					var lunar = $this.data("lunar");
					var ret = false;
					if(options.callbacks && $.isFunction(options.callbacks.click)) {
						ret = options.callbacks.click.apply(renderer, [$this, lunar]);
					}
					
					if(ret !== true) {
						$("td.gm-selected", renderer.table).removeClass("gm-selected");
						$this.addClass("gm-selected");
						
						if(lunar.monthType != 0) {
							renderer.calendar.gotoDate(lunar.date);
						}
					}
				});
			}
			
			// 鼠标经过
			if(!(options.callbacks && options.callbacks.hover === false)) {
				var timeoutHandler = 0;
				this.calendar.body.on("mouseenter", "td", function() {
					window.clearTimeout(timeoutHandler);
					var $this = $(this);
					var lunar = $this.data("lunar");
					var ret = false;
					if(options.callbacks && $.isFunction(options.callbacks.hover)) {
						ret = options.callbacks.hover.apply(renderer, [$this, lunar]);
					}
					if(ret !== true) {
						var offset = $this.position();
						var left = offset.left + $this.outerWidth();
						var top = offset.top;
						renderer.renderTips($this, lunar);
						if($this.is(":last-child")) {
							left = offset.left - renderer.tips.outerWidth();
						}
						renderer.tips.css({ left: left, top:  top});
						renderer.tips.fadeIn();
					}
				}).bind("mousemove", function() {
					window.clearTimeout(timeoutHandler);
				}).bind("mouseout", function() {
					window.clearTimeout(timeoutHandler);
					timeoutHandler = window.setTimeout(function() {
						renderer.tips.fadeOut();
					}, 500);
				});
			}
			
			// 工具类
			var tools = this.calendar.tools;
			if(tools) {
				$("[gm-command]", tools).each(function() {
					$(this).bind("click", function() {
						var $this = $(this);
						var command = $this.attr("gm-command");
						if($.isFunction(renderer.calendar[command])) {
							renderer.calendar[command].apply(renderer.calendar);
						}
					});
				});;
			}
		},
		
		renderTips: function(cell, lunar) {
			$("p.gm-date", this.tips).text([lunar.date.getFullYear(), "年", lunar.date.getMonth() + 1, "月", lunar.date.getDate(), "日"].join(""));
			$("p.gm-week", this.tips).text("星期" + lunar.week);
			$("p.gm-lunar", this.tips).text([lunar.lunarYear, "农历", lunar.lunarMonth + "月", lunar.lunarDate].join(" "));
			var options = this.calendar.options;
			var content = $("p.gm-content").empty();
			if(options.renderCallbacks && $.isFunction(options.renderCallbacks.renderTipsContent)) {
				var ret = options.renderCallbacks.renderTipsContent.apply(this, [cell, content, lunar]);
				if(ret === true) {
					content.show();
				} else {
					content.hide();
				}
			}
		},
		
		// 绑定数据
		bindData: function(callback) {
			var _date = this.calendar.date;
			var table = this.table;
			var renderer = this;
			if($.isFunction(callback)) {
				$("td", table).each(function(i, element) {
					var cell = $(this);
					var content = $(".gm-calendar-content", cell);
					var lunar = cell.data("lunar");
					callback.apply(renderer, [cell, content, lunar]);
				});
			}
		},
		
		// 绑定数据
		getCell: function(monthType, day, callback) {
			var _date = this.calendar.date;
			var table = this.table;
			var renderer = this;
			if($.isFunction(callback)) {
				var selector = "td"
				switch(monthType) {
					case -1:
						selector = "td.gm-calendar-last-month";
						break
					case 0:
						selector = "td.gm-calendar-current-month";
						break
					case 1:
						selector = "td.gm-calendar-next-month";
						break
				};
				var cell = $(selector + "[gm-day=\"" +  day + "\"]", table);
				if(cell.length > 0) {
					var content = $(".gm-calendar-content", cell);
					var lunar = cell.data("lunar");
					callback.apply(renderer, [cell, content, lunar]);
				}
			}
		},
		
		// 显示日期
		renderDate: function() {
			var _date = this.calendar.date;
			var month = _date.getMonth();
			var year = _date.getFullYear();
			var daysOfMonth = daysInMonth(month, year);
			var options = this.calendar.options;
			var weekends = options.weekends !== false;
			var table = this.table;
			var monthStartDay = (7 + _date.getDay() - (_date.getDate() -1 )%7)%7;
			var start = monthStartDay - options.firstDay;
			if(start <= 0) {
				start += 7;
			}
			var cells = $("td", table);
			var cell, lunar, date;
			// 当前月
			var step = 0;
			for(var i = 0; i < daysOfMonth; i++) {
				date = new Date(year, month, i+1)
				if(!weekends && (date.getDay() == 0 || date.getDay() == 6)) {
					step++;
					continue;
				}
				cell = cells.eq(start + i - step);
				
				this.renderCell(cell, date, 0, options);
				cell.addClass("gm-calendar-current-month");
			}
			// 上一个月最后一天
			var lastMonthEndDate = new Date(new Date(year, month, 1).getTime()-25*3600*1000);
			var lastEndYear = lastMonthEndDate.getFullYear();
			var lastEndMonth = lastMonthEndDate.getMonth();
			var lastEndDate = daysInMonth(lastEndMonth, lastEndYear);
			step = 0;
			for(var i = 0; i < start; i++) {
				date = new Date(lastEndYear, lastEndMonth, lastEndDate - start + i + 1);
				if(!weekends && (date.getDay() == 0 || date.getDay() == 6)) {
					step++;
					continue;
				}
				cell = cells.eq(i - step);
				this.renderCell(cell, date, -1, options);
				cell.addClass("gm-calendar-last-month");
			}
			
			// 下个月
			var netMonthBeginDate = new Date(new Date(year, month, 20).getTime()+15 * 24 * 3600 * 1000);
			var nextBeginYear = netMonthBeginDate.getFullYear();
			var nextBeginMonth = netMonthBeginDate.getMonth();
			var nextBeginDate = 1;
			step = 0;
			for(var i = 0, max = 42 - start - daysOfMonth; i < max; i++) {
				date = new Date(nextBeginYear, nextBeginMonth, i+nextBeginDate);
				if(!weekends && (date.getDay() == 0 || date.getDay() == 6)) {
					step++;
					continue;
				}
				cell = cells.eq(start + daysOfMonth + i);
				this.renderCell(cell, date, 1, options);
				cell.addClass("gm-calendar-next-month");
			}
			
			this.bindTools();
		},
		
		// 绑定工具类
		bindTools: function() {
			var tools = this.calendar.tools;
			if(tools) {
				var firstCell = $("td.gm-calendar-current-month", this.table);
				var lunar = firstCell.data("lunar");
				$("[gm-bind]", tools).each(function() {
					var $this = $(this);
					var property = $this.attr("gm-bind");
					if(lunar[property]) {
						$this.text(lunar[property]);	
					} else {
						$this.text("");
					}
				});
			}
		},
		
		renderCell: function(cell, date, monthType, options) {
			this.emptyCell(cell);
			lunar = lunarCalendar.convert(date);
			lunar.monthType = monthType;
			cell.data("lunar", lunar);
			cell.attr("gm-day", date.getDate());
			var ret = false;
			if(options.renderCallbacks && $.isFunction(options.renderCallbacks.renderCell)) {
				ret = options.renderCallbacks.renderCell.apply(this, [cell, lunar]);
			}
			if(ret !== true) {
				var content = $("<div class=\"gm-calendar-content\">").appendTo(cell);
				if(lunar.monthType == 0) {
					$("<div class=\"gm-calendar-solar\">").appendTo(cell).text(date.getDate());
					$("<div class=\"gm-calendar-lunar\">").appendTo(cell).text(this.getLunarString(lunar));
					if(options.renderCallbacks && $.isFunction(options.renderCallbacks.renderCellContent)) {
						ret = options.renderCallbacks.renderCellContent.apply(this, [cell, content, lunar]);
					}
				} else {
					content.text(date.getDate());
				}
			}
			
			if(lunar.isToday) {
				cell.addClass("gm-calendar-today");
			}
			if(lunar.festivals.important) {
				cell.addClass("gm-calendar-important");
			}
			if(lunar.date.getDay() == 0 || lunar.date.getDay()  == 6) {
				cell.addClass("gm-calendar-weekend");
			}
			
		},
		
		emptyCell: function(cell) {
			cell.removeClass("gm-calendar-current");
			cell.removeClass("gm-calendar-today");
			cell.removeClass("gm-calendar-important");
			cell.removeClass("gm-calendar-current-month");
			cell.removeClass("gm-calendar-last-month");
			cell.removeClass("gm-calendar-next-month");
			cell.html("");
		},
		
		getLunarString: function(lunar) {
			if(lunar.festivals.important) {
				return lunar.festivals[0].name;
			} else if(lunar.solar) {
				return lunar.solar;
			} else if(lunar.isMonthStart) {
				return lunar.lunarMonth + "月";
			} else {
				return lunar.lunarDate
			}
		},
	});
	
	// 农历计算器
	function LunarCalendar(){
		var today = new Date;
		var tgString = "甲乙丙丁戊己庚辛壬癸";
		var dzString = "子丑寅卯辰巳午未申酉戌亥";
		var numString = "〇一二三四五六七八九十";
		var monString = "正二三四五六七八九十冬腊";
		var dateString = ["初","十","廿","三十"];
		var weekString = "日一二三四五六";
		var sx = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
		var solarTerms = ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"];
		var solarData = [0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
		//国历节日 *表示重要节日，
		var solarFestivals = [
			"0101*元旦节",
			"0202 世界湿地日",
			"0210 国际气象节",
			"0214*情人节",
			"0301 国际海豹日",
			"0303 全国爱耳日",
			"0305 学雷锋纪念日",
			"0308*妇女节",
			"0312*植树节",
			"0312 孙中山逝世纪念日",
			"0314 国际警察日",
			"0315*消费者权益日",
			"0317 中国国医节",
			"0317 国际航海日",
			"0321 世界森林日",
			"0321 消除种族歧视国际日",
			"0321 世界儿歌日",
			"0322 世界水日",
			"0323 世界气象日",
			"0324 世界防治结核病日",
			"0325 全国中小学生安全教育日",
			"0330 巴勒斯坦国土日",
			"0401*愚人节",
			"0401 全国爱国卫生运动月(四月)",
			"0401 税收宣传月(四月)",
			"0405*清明节",
			"0407 世界卫生日",
			"0422 世界地球日",
			"0423 世界图书和版权日",
			"0424 亚非新闻工作者日",
			"0501*劳动节",
			"0504*青年节",
			"0505 碘缺乏病防治日",
			"0508 世界红十字日",
			"0512 国际护士节",
			"0515 国际家庭日",
			"0517 国际电信日",
			"0518 国际博物馆日",
			"0520 全国学生营养日",
			"0523 国际牛奶日",
			"0531 世界无烟日",
			"0601 国际儿童节",
			"0605 世界环境保护日",
			"0606 全国爱眼日",
			"0617 防治荒漠化和干旱日",
			"0623 国际奥林匹克日",
			"0625 全国土地日",
			"0626 国际禁毒日",
			"0701*香港回归纪念日",
			"0701 中共诞辰",
			"0701 世界建筑日",
			"0702 国际体育记者日",
			"0707 抗日战争纪念日",
			"0711 世界人口日",
			"0730 非洲妇女日",
			"0801*建军节",
			"0808 中国男子节(爸爸节)",
			"0815 抗日战争胜利纪念",
			"0908 国际扫盲日 国际新闻工作者日",
			"0909 毛泽东逝世纪念",
			"0910*教师节",
			"0914 世界清洁地球日",
			"0916 国际臭氧层保护日",
			"0918*九·一八事变纪念日",
			"0920 国际爱牙日",
			"0927 世界旅游日",
			"0928 孔子诞辰",
			"1001*国庆节",
			"1001 世界音乐日",
			"1001 国际老人节",
			"1002 国庆节假日",
			"1002 国际和平与民主自由斗争日",
			"1003 国庆节假日",
			"1004 世界动物日",
			"1006 老人节",
			"1008 全国高血压日",
			"1008 世界视觉日",
			"1009 世界邮政日",
			"1009 万国邮联日",
			"1010 辛亥革命纪念日",
			"1010 世界精神卫生日",
			"1013 世界保健日",
			"1013 国际教师节",
			"1014 世界标准日",
			"1015 国际盲人节(白手杖节)",
			"1016 世界粮食日",
			"1017 世界消除贫困日",
			"1022 世界传统医药日",
			"1024 联合国日",
			"1031 世界勤俭日",
			"1107 十月社会主义革命纪念日",
			"1108 中国记者日",
			"1109 全国消防安全宣传教育日",
			"1110 世界青年节",
			"1111 国际科学与和平周(本日所属的一周)",
			"1112 孙中山诞辰纪念日",
			"1114 世界糖尿病日",
			"1117 国际大学生节 世界学生节",
			"1120 彝族年",
			"1121 彝族年",
			"1121 世界问候日",
			"1121 世界电视日",
			"1122 彝族年",
			"1129 国际声援巴勒斯坦人民国际日",
			"1201 世界艾滋病日",
			"1203 世界残疾人日",
			"1205 国际经济和社会发展志愿人员日",
			"1208 国际儿童电视日",
			"1209 世界足球日",
			"1210 世界人权日",
			"1212 西安事变纪念日",
			"1213 南京大屠杀(1937年)纪念日！谨记血泪史！",
			"1220 澳门回归纪念",
			"1221 国际篮球日",
			"1224*平安夜",
			"1225 圣诞节",
			"1226 毛泽东诞辰纪念"];
	
		//农历节日 *表示放假日
		var lunarFestivals = [
			"0101*春节",
			"0115*元宵节",
			"0505*端午节",
			"0707*七夕节",
			"0715*中元节",
			"0815*中秋节",
			"0909*重阳节",
			"1208*腊八节",
			"1223 小年",
			"0100*除夕"]
		
		//某月的第几个星期几
		var regularFestivals = [
			"0150 世界麻风日", //一月的最后一个星期日（月倒数第一个星期日）
			"0520*国际母亲节",
			"0530 全国助残日",
			"0630*父亲节",
			"0730 被奴役国家周",
			"0932 国际和平日",
			"0940 国际聋人节 世界儿童日",
			"0950 世界海事日",
			"1011 国际住房日",
			"1013 国际减轻自然灾害日(减灾日)",
			"1144*感恩节"];
		var lunarData = [0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, // 1921-1930
						0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, // 1931-1940
						0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, // 1941-1950
						0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, // 1951-1960
						0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, // 1961-1970
						0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, // 1971-1980
						0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, // 1981-1990
						0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, // 1991-2000
						0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, // 2001-2010
						0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95]; // 2011-2020
		var madd = [0, 31,59,90,120,151,181,212,243,273,304,334];
		var festivalCache = {}; // 节日缓存（按年缓星期几的节日）
		
		function getBit(m, n) { return(m >> n) & 1; }
		function leftpad(n, l) { return Array(l||2 - String(n).length+1).join("0")+n; }
		function sortFestival(a, b){ return a.important ? -1 : 1 }
		
		function getSolar(year, month, date) {
			var date1 = new Date((31556925974.7*(year-1900)+solarData[month*2+1]*60000)+Date.UTC(1900,0,6,2,5));
			var date2 = date1.getUTCDate();
			var solarTerm = "";
			if (date2==date) {
			    solarTerm = solarTerms[month*2+1];
			}
			date1 = new Date((31556925974.7*(year-1900)+solarData[month*2]*60000)+Date.UTC(1900,0,6,2,5));
			date2= date1.getUTCDate();
			if (date2==date) { 
				solarTerm = solarTerms[month*2];
			}
			return solarTerm;
		}
		
		function getFestivals(year, month, date, day, lunarMonth, lunarDate) {
			var result = [];
			var cache = festivalCache["solar"];
			if(!cache) {
				festivalCache["solar"] = cache = mapFestivals(solarFestivals);
			}
			
			var festivals = cache[[month, date].join("-")] || []
			result = result.concat(festivals);
			
			cache = festivalCache["lunar"];
			if(!cache) {
				festivalCache["lunar"] = cache = mapFestivals(lunarFestivals);
			}
			festivals = cache[[lunarMonth - 1, lunarDate].join("-")] || []
			result = result.concat(festivals);
			if(result.length > 0) {
				result.sort(sortFestival);
				result.important = result[0].important;
			}
			return result;
		}
		
		function mapFestivals(festivals) {
			var dict = {};
			var key;
			// 公立节日
			for(var i in festivals) {
				if(festivals[i].match(/^(\d{2})(\d{2})([\s\*])(.+)$/)) {
					key = [Number(RegExp.$1)-1, Number(RegExp.$2)].join("-");
					if(!dict[key]) {
						dict[key] = [];
					}
					dict[key].push({
						name: RegExp.$4,
						important: RegExp.$3 == "*"
					});
				}
			}
			return dict;
		}
		
		function getCapitalNumber(num, hex) {
			if(hex) {
				if(num == 10)  return "十";
				if(num == 11)  return "十一";
				if(num == 12)  return "十二";
			}
			
			var str = String(num);
			var result = [];
			for(var i in str) {
				result.push(numString[str[i]]);
			}
			return result.join("");
		}
		
		function getLunarDate(date) {
			return [dateString[date%10 == 0 ? date/10  : (Math.ceil(date/10)-1)], date== 10 ? dateString[0] : date==30 ? "" : date%10 == 0 ? "十": numString.charAt(date%10)].join("");
		}
		
		this.convert = function convert(_date) {
			var total, m, n, k;
			var lunarYear, lunarMonth, lunarDate, isLeapMonth;
			var lunarYearString, lunarMonthString, lunarDateString;
			var capitalYear, capitalMonth, capitalDate;
			var zodiac, solar, festivals;
			var isEnd = false;
			var year = _date.getFullYear();
			var month = _date.getMonth();
			var date = _date.getDate();
			var day = _date.getDay();
			total = (year - 1921) * 365 + Math.floor((year - 1921) / 4) + madd[month] + date - 38;
			if(year % 4 == 0 && month > 1) {
				total++;
			}
		
			for(m = 0;; m++) {
				k = (lunarData[m] < 0xfff) ? 11 : 12;
				for(n = k; n >= 0; n--) {
					if(total <= 29 + getBit(lunarData[m], n)) {
						isEnd = true;
						break;
					}
					total = total - 29 - getBit(lunarData[m], n);
				}
				if(isEnd) break;
			}
		
			lunarYear = 1921 + m;
			lunarMonth = k - n + 1;
			lunarDate = total;
			if(k == 12) {
				if(lunarMonth == Math.floor(lunarData[m] / 0x10000) + 1) {
					lunarMonth = 1 - lunarMonth;
				}
				if(lunarMonth > Math.floor(lunarDate[m] / 0x10000) + 1) {
					lunarMonth--;
				}
			}
			
			// 天干地之
			isLeapMonth = lunarMonth < 1;
			lunarYearString = tgString.charAt((lunarYear - 4) % 10) + dzString.charAt((lunarYear - 4) % 12) + "年";
			lunarMonthString = monString.charAt(isLeapMonth?-1:1 * lunarMonth - 1);
			lunarDateString = getLunarDate(lunarDate);
			zodiac = sx.charAt((lunarYear - 4) % 12); // 生肖
			solar = getSolar(year, month, date); // 节气
			festivals = getFestivals(year, month, date, day, lunarMonth, lunarDate);
			// 大写年月日
			capitalYear =  getCapitalNumber(year);
			capitalMonth =  getCapitalNumber(month+1, true);
			capitalDate =  getCapitalNumber(date, true);
			
			return {
				isToday: today.getFullYear() == year && today.getMonth() == year && today.getDate() == date,
				date: _date,
				year: year,
				month: month,
				day: date,
				isMonthStart: lunarDate == 1, // 是否初一
				lunarYear: lunarYearString, // 天干地之年
				lunarMonth: lunarMonthString, // 天干地之月
				lunarDate: lunarDateString, // 天干地之日
				capitalYear: capitalYear, // 大写年
				capitalMonth: capitalMonth, // 大写月
				capitalDate: capitalDate, // 大写日
				week: weekString[_date.getDay()],
				zodiac: zodiac, // 节气
				solar: solar, // 生肖
				festivals: festivals //  
			}
		}
	};
	
	// Class类
	function Class() {
		var len = arguments.length;
	    var P = arguments[0];
	    var F = arguments[len-1];
	    var C = typeof F.init == "function" ?
	        F.init :
	        function(){ P.prototype.init.apply(this, arguments); };
	
	    if (len > 1) {
	        var newArgs = [C, P].concat(
	                Array.prototype.slice.call(arguments).slice(1, len-1), F);
	        inherit.apply(null, newArgs);
	    } else {
	        C.prototype = F;
	    }
	    return C;
	}
	
	// 继承方法
	function inherit(C, P) {
		var F = function() {};
		F.prototype = P.prototype;
		C.prototype = new F;
		var i, l, o;
		for(i=2, l=arguments.length; i<l; i++) {
			o = arguments[i];
		    if(typeof o === "function") {
		    		o = o.prototype;
		    }
		    $.extend(C.prototype, o);
		}
	}
	
})(jQuery);
