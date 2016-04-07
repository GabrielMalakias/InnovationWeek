ActiveAdmin.register Doodle::Keyword::Action, as: "KeywordAction" do
  menu parent: 'Keyword'
  permit_params :name, :value
end
